// input
class Klass {
  method() {
    /* CS */a.b/* CE */.c = 3;
  }
}
// output
class Klass {
  method() {
    const {
      /* CS */b/* CE */
    } = a;

    /* CS */b/* CE */.c = 3;
  }
}
