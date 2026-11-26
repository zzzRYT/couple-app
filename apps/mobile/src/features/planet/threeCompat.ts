// Three's CommonJS entry emits a Node warning, which Hermes does not implement.
if (typeof process !== 'undefined' && typeof process.emitWarning !== 'function') process.emitWarning = () => {};
