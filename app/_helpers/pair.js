export default (index, options) => {
  if (parseInt(index) % 2 === 0) {
    return options.fn(this);
  }

  return options.inverse(this);
}