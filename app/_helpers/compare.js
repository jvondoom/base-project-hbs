export default (lvalue, rvalue, options) => {
  if (arguments.length < 3) {
    throw new Error(`Handlerbars Helper 'compare' needs 2 parameters`);
  }

  const operator = options.hash.operator || "==";

  const operators = {
    '==':  (l,r) => l == r,
    '===': (l,r) => l === r,
    '!=':   (l,r) => l != r,
    '<':   (l,r) => l < r,
    '>':   (l,r) => l > r,
    '<=':  (l,r) => l <= r,
    '>=':  (l,r) => l >= r,
    'typeof': (l,r) => typeof l == r
  }

  if (!operators[operator]) {
    throw new Error(`Handlerbars Helper 'compare' doesn't know the operator ${operator}`);
  }

  const result = operators[operator](lvalue,rvalue);

  if( result ) {
    return options.fn(this);
  }

  return options.inverse(this);
}
