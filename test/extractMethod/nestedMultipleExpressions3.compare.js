// input
() => {
  /* CS */5 + 5;
  5 + 5;/* CE */
  5 + 5;
}
// output
() => {
  const extracted = () => {
    5 + 5;
    5 + 5;
  };

  extracted();
  5 + 5;
}
