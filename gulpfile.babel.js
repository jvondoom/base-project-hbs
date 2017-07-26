// generated on 2015-08-24 using generator-gulp-webapp 1.0.3
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import { argv } from 'yargs';
import del from 'del';
import runSequence from 'run-sequence';
import {stream as wiredep} from 'wiredep';
import eslint from 'gulp-eslint';
import handlebarHelpers from './app/_helpers/helpers.js';
import layouts from 'handlebars-layouts';
import handlebars from 'handlebars';
import glob from 'glob';
// Register helpers
handlebars.registerHelper(layouts(handlebars));

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

const styleGuide = {
  source: './app/',
  destination: './app/public/styleguide',

  // The css and js paths are URLs, like '/misc/jquery.js'.
  // The following paths are relative to the generated style guide.
  css: '../styles/main.css',
  js: [
        '/bower_components/jquery/dist/jquery.js',
        '/bower_components/babel-polyfill/browser-polyfill.js',
        '../scripts/main.js'
      ],
  homepage: 'homepage.md',
  title: 'Sanderson Farms Styleguide'
};

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.', 'bower_components/bootstrap-sass/assets/stylesheets/']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['last 4 versions']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('html', ['styles'], () => {
  const assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('app/public/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.htmlmin({ collapseWhitespace: true, removeComments: true })))
    .pipe(gulp.dest('dist'));
});

gulp.task('hbs', () => {

  delete require.cache[require.resolve( './app/_data/structure.data.js' )]; // clean up the cache to refresh changes in structure.data

  // clean up the cache for internal scripts to refresh changes in structure.data
  glob('./app/_pages/**/*.js', options, function (er, files) {

    for (let file of files) {
      delete require.cache[require.resolve( file )];
    }
  });

  glob('./app/_partials/**/*.js', options, function (er, files) {

    for (let file of files) {
      delete require.cache[require.resolve( file )];
    }
  });

  const jsonData = require('./app/_data/structure.data.js');

  const options = {
    batch : ['./app/_partials', './app/_components', './app/_layouts'],
    helpers : handlebarHelpers
  }

  return gulp.src('app/_pages/**/*.hbs')
    .pipe($.compileHandlebars( jsonData, options ))
    .pipe($.rename({ extname: '.html' }))
    .pipe($.flatten())
    .pipe(gulp.dest('./app/public/'));
});

gulp.task('lint', () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp.src('app/scripts/es6/**/*.js')
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});


var notifier = require('node-notifier');
// Standard handler
var standardHandler = function (err) {
  // Notification
  // var notifier = new notification();
  notifier.notify({ message: 'Error: ' + err.message });
  // Log to console
  $.util.log($.util.colors.red('Error'), err.message);
}

// Es6 browserify and babel
// enable module system
gulp.task('es6', () => {

  browserify({
    entries: './app/scripts/es6/main.js',
      debug: true
    })
    .transform(babelify)
    .on('error', standardHandler)
    .bundle()
    .on('error', standardHandler)
    .pipe(source('main.js'))
    .pipe(gulp.dest('./app/scripts/'));
});


// Combine svg files and inject it into index.html
gulp.task('svg', () => {
    var svgs = gulp
        .src('./app/images/svg/*.svg')
        .pipe($.svgmin())
        .pipe($.svgstore({ inlineSvg: true }));

    function fileContents (filePath, file) {
        return file.contents.toString();
    }

    return gulp
        .src('app/_partials/global/svgs.hbs')
        .pipe($.inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('app/_partials/global/'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['env-config', 'clean'], () => {
  runSequence(
    ['es6', 'svg', 'wiredep', 'hbs', 'lint', 'styles', 'fonts'],
    () => {
      browserSync({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app/public/', 'app/'],
        routes: {
          '/bower_components': 'bower_components',
          '/node_modules': 'node_modules'
        }
      }
    });

      gulp.watch(['app/**/*.hbs','app/_data/structure.data.js','app/_pages/**/*.js', 'app/_partials/**/*.js'], ['hbs', reload]);
      gulp.watch('app/images/svg/*.svg', ['svg']);
      gulp.watch(['app/styles/**/*.scss', 'app/_components/**/*.scss', 'app/_partials/**/*.scss', 'app/_pages/**/*.scss'], ['styles', reload]);
      gulp.watch('app/scripts/es6/**/*.js', ['lint','es6']);
      gulp.watch('app/fonts/**/*', ['fonts']);
      gulp.watch(['app/images/**/*','app/scripts/**/*.js']).on('change', reload);
    }
  );
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('copy', function () {
  gulp.src(['dist/**/*', '!dist/**/*.html'])
  .pipe(gulp.dest('../backend/project/web/app/themes/sanderson-farm-theme/assets/')); // Please update Back-End project name if is necessary.
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/**/*.hbs')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['env-config'], () => {
  runSequence(
    'es6',
    'hbs',
    ['svg', 'lint', 'images', 'fonts'],
    ['html'],
    ['extras'],
    () => {
      return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
    }
  );
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});

gulp.task('env-config', () => {

  const env = argv.env || 'dev',
        src = `./appconfig/${env}.config.js`,
        dest = 'app/scripts/es6/helpers/';

  return gulp.src(src)
             .pipe($.rename('config.js'))
             .pipe(gulp.dest(dest));
});
