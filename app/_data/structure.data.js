import { prefix } from '../scripts/es6/helpers/';
import home from '../_pages/home/home';

module.exports = {
  global: {
    prefix: prefix,
    nav: {
      logo: {
        text: "HANGAR"
      }
    },
    footer: {
      copyright: "The Hangar 2017"
    }
  },
  pages: {
    home: home
  }
}
