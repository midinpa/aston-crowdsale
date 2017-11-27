var src_index;
// print process.argv
process.argv.forEach(function (val, index, array) {
  if(val == '--src') {
    src_index = index;
  }
});

module.exports = process.argv[src_index + 1];
