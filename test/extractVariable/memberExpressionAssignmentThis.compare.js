// input
class Klass {
  method() {
    /* CS */this.a/* CE */ = 5;
    /* CS */this.a/* CE */ = 6;
  }
}

// output
class Klass {
  method() {
    const {
      /* CS */a/* CE */
    } = this;

    /* CS */a/* CE */ = 5;
    /* CS */a/* CE */ = 6;
  }
}
