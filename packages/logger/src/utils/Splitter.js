class Splitter {
  buf = ''
  end = 0

  constructor(sep = '\n') {
    this.sep = sep
  }

  append(data) {
    this.buf = this.buf.substring(this.end) + data
    this.end = 0
  }

  next() {
    const start = this.end
    this.end = this.buf.indexOf(this.sep, start)
    if (this.end >= 0) {
      this.end += this.sep.length
      return { value: this.buf.substring(start, this.end), done: false }
    }
    this.end = start
    return { done: true }
  }
}

module.exports = Splitter
