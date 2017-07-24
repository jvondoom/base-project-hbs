export default (v1, options) => {
  if(!v1) {
    return options.fn(this);
  }
  return options.inverse(this);
}