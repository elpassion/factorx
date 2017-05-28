// input
const { e } = a.b;
/* CS */a.b.c/* CE */
/* CS */a.b.c/* CE */.d
// output
const {
  e,
  /* CS */c/* CE */
} = a.b;
/* CS */c/* CE */
/* CS */c/* CE */.d
