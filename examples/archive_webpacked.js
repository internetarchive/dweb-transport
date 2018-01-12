/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 30);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint max-len: 0 */
// TODO: eventually deprecate this console.trace("use the `babel-register` package instead of `babel-core/register`");
module.exports = __webpack_require__(31);


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ArchiveFile__ = __webpack_require__(15);
/*
Based on https://stackoverflow.com/questions/30430982/can-i-use-jsx-without-react-to-inline-html-in-script
I wanted this because React was doing nasty things at run-time (like catching events) and stopping Search box working

This expanded in use to make it easier to use HTML in as unchanged form from existing react in particular.
- URLs in image tags are re-rooted, i.e. <img src="/foo"> => <img src="https://bar.com/foo">
- look at onClick's especially if set window.location
 */



function deletechildren(el, keeptemplate) {
    //TODO-DETAILS-REACT copied from htmlutils, maybe include that instead
    /*
    Remove all children from a node
    :param el:  An HTML element, or a string with id of an HTML element
    */
    if (typeof keeptemplate === "undefined") keeptemplate = true;
    el = typeof el === "string" ? document.getElementById(el) : el;
    // Carefull - this deletes from the end, because template if it exists will be firstChild
    while (el.lastChild && !(keeptemplate && el.lastChild.classList && el.lastChild.classList.contains("template"))) {
        // Note that deletechildren is also used on Span's to remove the children before replacing with text.
        el.removeChild(el.lastChild);
    }
    return el; // For chaining
}

class React {
    static config(options) {
        /*
            Configure ReachFake
             root: protocol and host to insert before URLs (currently in img tags only) e.g. "https://archive.org"
         */
        for (x of options) React._config[x] = options[x];
    }
    static createElement(tag, attrs, children) {
        // Note arguments is set to tag, attrs, child1, child2 etc
        var element = document.createElement(tag);
        for (let name in attrs) {
            let attrname = name.toLowerCase() === "classname" ? "class" : name;
            if (name === "dangerouslySetInnerHTML") {
                element.innerHTML = attrs[name]["__html"];
                delete attrs.dangerouslySetInnerHTML;
            }
            if (["img.src", "a.href"].includes(tag + "." + name) && typeof attrs[name] === "string" && attrs[name].startsWith('/')) {
                if (!React._config.root) console.error("Need to React.config({root: 'https://xyz.abc'");
                attrs[name] = React._config.root + attrs[name]; // e.g. /foo => https://bar.com/foo
            }
            if (["img.src"].includes(tag + "." + name) && attrs[name] instanceof __WEBPACK_IMPORTED_MODULE_0__ArchiveFile__["a" /* default */]) {
                attrs[name].loadImg(element);
            } else if (["video.src", "img.src"].includes(tag + "." + name) && attrs[name] instanceof __WEBPACK_IMPORTED_MODULE_0__ArchiveFile__["a" /* default */]) {
                attrs[name].loadStream(element);
            } else if (name && attrs.hasOwnProperty(name)) {
                let value = attrs[name];
                if (value === true) {
                    element.setAttribute(attrname, name);
                } else if (typeof value === "object" && !Array.isArray(value)) {
                    // e.g. style: {{fontSize: "124px"}}
                    for (let k in value) {
                        element[attrname][k] = value[k];
                    }
                } else if (value !== false && value != null) {
                    element.setAttribute(attrname, value.toString());
                }
            }
        }
        for (let i = 2; i < arguments.length; i++) {
            let child = arguments[i];
            if (!child) {} else if (Array.isArray(child)) {
                child.map(c => element.appendChild(c.nodeType == null ? document.createTextNode(c.toString()) : c));
            } else {
                element.appendChild(child.nodeType == null ? document.createTextNode(child.toString()) : child);
            }
        }
        return element;
    }
    static domrender(els, node) {
        deletechildren(node, false);
        node.appendChild(els);
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = React;
;

//Default configuration
React.config = {
    root: "https://archive.org"
};

/***/ }),
/* 2 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = __webpack_require__(37)
var ieee754 = __webpack_require__(38)
var isArray = __webpack_require__(22)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8)))

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!

//import React from 'react';
 // Note React is used by the JSX compiler that handles the HTML below this fakes the React.createElement


class Util {
    static number_format(nStr) //this is just addCommas now
    {
        //http://www.mredkj.com/javascript/numberFormat.html
        nStr += '';

        let x = nStr.split('.');
        let x1 = x[0];
        let x2 = x.length > 1 ? '.' + x[1] : '';
        let rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) x1 = x1.replace(rgx, '$1' + ',' + '$2');
        return x1 + x2;
    }

    static glyph({ name = 'question', classes = '' } = {}) {
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'span',
            { className: classes },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-' + name, 'aria-hidden': 'true' }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'span',
                { className: 'sr-only' },
                name
            )
        );
    }

    // pass in a <mediatype> value
    static mediatype_icon(mediatype) {
        const ICONS = {
            "audio": "audio",
            "collection": "collection",
            "etree": "etree",
            "image": "image",
            "data": "data",
            "movies": "movies",
            "movingimage": "movies",
            "other": "question",
            "software": "software",
            "sound": "audio",
            "stillimages": "image",
            "text": "texts",
            "texts": "texts",
            "tv": "tv",
            "unknown": "question",
            "video": "movies",
            "search": "search",
            "forum": "comments",
            "web": "web",
            "article": "article",
            "account": "person",
            "quote": "quote",
            "ad": "tv-commercial"
        };

        let icon = ICONS[mediatype];
        if (!icon) icon = 'question';

        return this.glyph({ name: icon });
    }

    static natcompare(a, b) {
        return natcompare(a, b);
    }

    static AJS_on_dom_loaded() {
        /*
        This function is copied from archive.min.js because
        a) its run there on DOMLoaded, which is before we've got anything on the page
        b) Its anonymous in archive.min.js so can't call it
         */
        // Use this global hack, by adding class 'accessible-link' to any mouse-only element div/img
        // Note AJS is defined in archive_min.js
        AJS.makeMouseElementAccessible('.accessible-link');

        AJS.setUpActionTracking(); // Must be before other form submit handlers are assigned
        AJS.setupPopupLink();
        AJS.nav_tophat_setup();
        AJS.nav_tophat_wb_setup();
        AJS.setUpCreativeCommonsLicenseLink();
        AJS.setUpSearchForms();

        /* global  archive_setup */
        if (typeof archive_setup !== 'undefined') {
            // when DOM loaded/stable, do some setup
            $(() => {
                for (const fn of archive_setup) fn();
                /*TODO may need to delete fn so doesnt stay between pages */
            });
        }

        AJS.footer();
    }

    static async fetch_json(url) {
        /*
        url:   to be fetched - construct CORS safe JSON enquiry.
        throws: TypeError if cant fetch
        throws: Error if fetch doesnt return JSON.
        resolves to: Decoded json response
         */
        let response = await fetch(new Request(url, // Throws TypeError on failed fetch
        {
            method: 'GET',
            headers: new Headers(),
            mode: 'cors',
            cache: 'default',
            redirect: 'follow' // Chrome defaults to manual
        }));
        if (response.ok) {
            if (response.headers.get('Content-Type') === "application/json") {
                return await response.json(); // response.json is a promise resolving to JSON already parsed
            } else {
                let t = response.text(); // promise resolving to text
                throw new Error(`Unable to fetch, return was not JSON - got: ${response.headers.get('Content-Type')} ${t}`);
            }
        } // Note - if copy this for binary files, make sure to look at TransportHTTP which uses response.arrayBuffer
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Util;


/* === Configuration info ==== */
Util.archiveMimeTypeFromFormat = {
    JPEG: "image/jpeg",
    PNG: "image/png"
}; //TODO expand to other formats - see mimetypes list from petabox
Util.imageFormats = ['JPEG', 'PNG']; //TODO expand to other formats - see mimetypes list from petabox
Util.downloadableFormats = {
    'JPEG Thumb': 'JPEG THUMB',
    'JPEG 250px Thumb': 'JPEG 250PX THUMB',
    "JPEG 500px Thumb": 'JPEG 500PX THUMB',
    'Archive BitTorrent': 'TORRENT',
    "JPEG": "JPEG",
    "PNG": "PNG"

    // minified FROM http://sourcefrog.net/projects/natsort/natcompare.js
};function isWhitespaceChar(B) {
    var A;A = B.charCodeAt(0);if (A <= 32) {
        return true;
    } else {
        return false;
    }
}function isDigitChar(B) {
    var A;A = B.charCodeAt(0);if (A >= 48 && A <= 57) {
        return true;
    } else {
        return false;
    }
}function compareRight(E, B) {
    var G = 0;var F = 0;var D = 0;var C;var A;for (;; F++, D++) {
        C = E.charAt(F);A = B.charAt(D);if (!isDigitChar(C) && !isDigitChar(A)) {
            return G;
        } else {
            if (!isDigitChar(C)) {
                return -1;
            } else {
                if (!isDigitChar(A)) {
                    return +1;
                } else {
                    if (C < A) {
                        if (G == 0) {
                            G = -1;
                        }
                    } else {
                        if (C > A) {
                            if (G == 0) {
                                G = +1;
                            }
                        } else {
                            if (C == 0 && A == 0) {
                                return G;
                            }
                        }
                    }
                }
            }
        }
    }
}function natcompare(I, H) {
    var C = 0,
        A = 0;var D = 0,
        B = 0;var F, E;var G;while (true) {
        D = B = 0;F = I.charAt(C);E = H.charAt(A);while (isWhitespaceChar(F) || F == "0") {
            if (F == "0") {
                D++;
            } else {
                D = 0;
            }F = I.charAt(++C);
        }while (isWhitespaceChar(E) || E == "0") {
            if (E == "0") {
                B++;
            } else {
                B = 0;
            }E = H.charAt(++A);
        }if (isDigitChar(F) && isDigitChar(E)) {
            if ((G = compareRight(I.substring(C), H.substring(A))) != 0) {
                return G;
            }
        }if (F == 0 && E == 0) {
            return D - B;
        }if (F < E) {
            return -1;
        } else {
            if (F > E) {
                return +1;
            }
        }++C;++A;
    }
};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ArchiveFile__ = __webpack_require__(15);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!

//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';


// Notes on use of JSX (embedded HTML) for when converting HTML to JSX
// Anything that is to be parameterised gets {} and code between is javascript executed in context (this has the expected meaning)
// By implication an embedded object is {{foo: bar}}
// All comments have to be quoted <!--foo--> becomes {/*--foo--*}
// The "ReactFake code is a little more tolerant than React, specifically
// React requires style={{display: none}} ReactFake can also handle quoted style="display: none"
// React requires className= rather than class=, ReactFake supports both





class Details extends __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__["a" /* default */] {
    constructor(id, item = undefined) {
        super(id);
        this.item = item;
        this._listLoad();
    }

    navwrapped() {
        /* Wrap the content up checked on mbid (Red Shift) image:  wrap( TODO-TODO-DONATEBANNER | nav-wrap1 | maincontent | theatre-ia-wrap | item-details-about | TODO-ACTIONBUTTONS | TODO-ALSOFOUND  | TODO-ANALYTICS )
        returns:      JSX elements tree suitable for passing to ReactDOM.render or ReactDOMServer.renderToStaticMarkup
         */
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'wrap', itemscope: true, itemtype: this.itemtype },
            new Nav().navwrapJSX(),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { 'class': 'container container-ia' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('a', { name: 'maincontent', id: 'maincontent' })
            ),
            this.theatreIaWrap(),
            ' ',
            this.itemDetailsAboutJSX()
        );
    }

    archive_setup_push() {
        archive_setup.push(function () {
            // This is common to Text, AV and image - though some have stuff before this and some a
            AJS.tilebars(); // page load
            $(window).on('resize  orientationchange', function (evt) {
                clearTimeout(AJS.also_found_throttler);
                AJS.also_found_throttler = setTimeout(AJS.tilebars, 250);
            });
        });
    }
    browserAfter() {
        // initialize_flag
        // overlay related
        $(".toggle-flag-overlay").click(function (e) {
            e.preventDefault();
            $("#theatre-ia-wrap").removeClass("flagged");
        });
        // overlay - checkboxes
        $("#flag-checkboxes a").on("click", function (e) {
            e.preventDefault();
            $(this).children(".my-checkbox").toggleClass("checked");
            $.get($(this).attr("href"));
        });
        super.browserAfter(); // runs archive_setup_push and Util.AJS_on_dom_loaded(); Do this after the scripts above - which means put this browserAfter AFTER superclasses
    }

    cherModal(type) {
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'cher-modal', className: 'modal fade', role: 'dialog', 'aria-hidden': 'true' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { 'class': 'modal-dialog modal-lg' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'modal-content', style: 'padding:10px;' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'modal-header' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'button',
                            { type: 'button', 'class': 'close', 'data-dismiss': 'modal', 'aria-hidden': 'true' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', {
                                'class': 'iconochive-remove-circle', 'aria-hidden': 'true' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'sr-only' },
                                'remove-circle'
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'h3',
                            { 'class': 'modal-title' },
                            'Share or Embed This Item'
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { id: 'cher-body' },
                        this.sharing(),
                        this.embed(),
                        this.embedWordpress(),
                        this.embedAdvanced(type)
                    )
                )
            )
        );
    }

    sharing() {
        //Common text across Image and Text and possibly other subclasses
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        let metadata = item.metadata; // Shortcut as used a lot
        let detailsURL = `https://archive.org/details/${itemid}`; // Note this should remain as pointing at details/itemid since its only used in sharing - FB, Twitter etc
        let sharingText = `${metadata.title} : ${metadata.creator}`; //String used
        let sharingTextUriEncoded = encodeURIComponent(sharingText);

        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { style: { textAlign: "center", margin: "50px auto" } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { className: 'topinblock' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { id: 'sharer' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `https://twitter.com/intent/tweet?url=${detailsURL}&amp;via=internetarchive&amp;text=${sharingTextUriEncoded}+%3A+${metadata.creator}+%3A+Free+Download+%26+Streaming+%3A+Internet+Archive`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-twitter', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share to Twitter' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `https://www.facebook.com/sharer/sharer.php?u=${detailsURL}`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-facebook', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share to Facebook' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `https://plus.google.com/share?url=${detailsURL}`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-googleplus', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share to Google+' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `http://www.reddit.com/submit?url=${detailsURL}&amp;title=${sharingTextUriEncoded}+%3A+${metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-reddit', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share to Reddit' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `https://www.tumblr.com/share/video?embed=%3Ciframe+width%3D%22640%22+height%3D%22480%22+frameborder%3D%220%22+allowfullscreen+src%3D%22https%3A%2F%2Farchive.org%2Fembed%2F%22+webkitallowfullscreen%3D%22true%22+mozallowfullscreen%3D%22true%22%26gt%3B%26lt%3B%2Fiframe%3E&;name=${itemid}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-tumblr', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share to Tumblr' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `http://www.pinterest.com/pin/create/button/?url=${detailsURL}&amp;description=${sharingTextUriEncoded}+%3A+${metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-pinterest', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share to Pinterest' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `https://archive.org/pop/editor.html?initialMedia=${detailsURL}`,
                            target: '_blank' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'class': 'sharee iconochive-popcorn', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: 'Share to Popcorn Maker' })
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'a',
                        { href: `mailto:?body=${detailsURL}&amp;subject=${sharingText} : ${metadata.creator} : Free Download &amp; Streaming : Internet Archive` },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-email', 'data-toggle': 'tooltip',
                            'data-placement': 'bottom', title: '',
                            'data-original-title': 'Share via email' })
                    )
                ),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', { clear: 'all', className: 'clearfix' })
            )
        );
    }
    embedWordpress() {
        // THis appeared on image and movie examples
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            null,
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'form',
                { className: 'form', role: 'form' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'form-group' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'label',
                        null,
                        'EMBED (for wordpress.com hosted blogs)'
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'textarea',
                        { id: 'embedcodehereWP', className: 'form-control textarea-invert-readonly',
                            rows: '3', readOnly: 'readonly' },
                        `[archiveorg ${itemid} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`
                    )
                )
            )
        );
    }
    embedAdvanced(type) {
        // From text, video, image
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            null,
            'Want more?',
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'a',
                { href: `https://archive.org/help/${type}.php?identifier=${itemid}` },
                'Advanced embedding details, examples, and help'
            ),
            '!'
        );
    }
    embed() {
        // Same on text, video, image
        let shortEmbedURL = `https://archive.org/stream/${this.itemid}?ui=embed`; //Note on archive.org/details this is different from iframeURL and not clear if that is intentional
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            null,
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'form',
                { 'class': 'form', role: 'form' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'form-group' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'label',
                        null,
                        'EMBED'
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'textarea',
                        { id: 'embedcodehere', 'class': 'form-control textarea-invert-readonly',
                            rows: '3', readonly: 'readonly' },
                        `<iframe 
                                src=${shortEmbedURL}
                                width="480" height="430" frameborder="0"
                                webkitallowfullscreen="true" mozallowfullscreen="true"
                                allowfullscreen></iframe>`
                    )
                )
            )
        );
    }

    itemDetailsAboutJSX() {
        /* This builds a JSX tht sits underneth theatre-ia-wrap DIV that is built by theatreIaWrap */
        let itemid = this.itemid;
        let item = this.item;
        let metadata = item.metadata;
        let title = metadata.title;
        let creator = metadata.creator;
        let datePublished = metadata.date;
        let publisher = metadata.publisher;
        let keywords = metadata.subject ? metadata.subject.split(';') : undefined;
        let licence = metadata.licenseurl; //TODO - handle other licenses - hardwired for CC currently
        let languageAbbrev = metadata.language;
        let languageLong = { eng: "English", dut: "Dutch" }[languageAbbrev]; //TODO-other languages
        let description = metadata.description; // Contains HTML (supposedly safe) inserted via innerHTML thing
        let metadataListPossible = { color: "Color", coverage: "Location", director: "Director", identifier: "Identifier",
            "identifier-ark": "Identifier-ark", ocr: "Ocr", runtime: "Run time", ppi: "Ppi", sound: "Sound", year: "Year" }; /*TODO expand to longer list*/
        let metadataListFound = Object.keys(metadataListPossible).filter(k => metadata[k]); // List of keys in the metadata
        let downloadableFiles = this._list.filter(f => f.downloadable()); // Note on image it EXCLUDED JPEG Thumb, but included JPEG*Thumb
        //TODO  Replace "a" with onclicks to download function on f
        //TODO Need f.sizePretty property of ArchiveFile (see prettierbytes used in WebTorrent)
        let filesCount = item.files_count;
        let originalFilesCount = item.files.filter(f => f.source === "original").length + 1; // Adds in Archive Bittorrent
        let downloadURL = `https://archive.org/download/${itemid}`;
        let compressURL = `https://archive.org/compress/${itemid}`;
        let compressAllURL = `https://archive.org/compress/${itemid}/formats=JSON,METADATA,JPEG,ARCHIVE BITTORRENT,MUSICBRAINZ METADATA`;
        let collections = Array.isArray(metadata.collection) ? metadata.collection : [metadata.collection];
        let mediatype = metadata.mediatype;
        let iconochiveIcon = "iconochive-" + mediatype;
        let contributor = metadata.contributor;
        let reviews = item.reviews;
        let writeReviewsURL = `https://archive.org/write-review.php?identifier=${itemid}`;
        let loginURL = "https://archive.org/account/login.php";
        let bookmarksAddURL = `https://archive.org/bookmarks.php?add_bookmark=1&amp;mediatype=image&amp;identifier=${itemid}&amp;title=${title}`;
        let credits = metadata.credits;
        //TODO-DETAILS much of below doesn't work (yet)
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { 'class': 'container container-ia item-details-about' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { 'class': 'relative-row row' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'action-buttons' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'topinblock' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'a',
                            { 'class': 'button ', href: bookmarksAddURL, id: 'favorite-button', 'aria-haspopup': 'true',
                                onclick: 'return AJS.modal_go(this,{{favorite:1}})', 'data-target': '#confirm-modal', 'data-toggle': 'tooltip',
                                'data-container': 'body', 'data-placement': 'bottom', title: 'Favorite this item' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-favorite', 'aria-hidden': 'true' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'sr-only' },
                                'favorite'
                            )
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'topinblock' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'button',
                            { id: 'share-button', 'class': 'button', type: 'button', 'aria-haspopup': 'true',
                                onclick: 'return AJS.modal_go(this,{{ignore_lnk:1,shown:AJS.embed_codes_adjust}})',
                                'data-target': '#cher-modal', 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'bottom',
                                title: 'Share this item' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-share', 'aria-hidden': 'true' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'sr-only' },
                                'share'
                            )
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        {
                            id: 'flag-button-container', 'class': 'topinblock', 'data-toggle': 'tooltip', 'data-placement': 'bottom',
                            'data-container': 'body', title: 'Flag this item' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'dropup' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'button',
                                { id: 'flag-button', 'class': ' button', type: 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true',
                                    'aria-expanded': 'false' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-Flag', 'aria-hidden': 'true' }),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    {
                                        'class': 'sr-only' },
                                    'flag'
                                )
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { id: 'flag-popover', 'class': 'dropdown-menu', 'aria-labelledby': 'flag-button' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'h3',
                                    { 'class': 'dropdown-title' },
                                    'Flag this item for'
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'ul',
                                    { role: 'menu' },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'li',
                                        { 'class': '' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'a',
                                            { href: loginURL, role: 'menuitem' },
                                            'Graphic Violence '
                                        )
                                    ),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'li',
                                        { 'class': '' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'a',
                                            { href: loginURL, role: 'menuitem' },
                                            'Graphic Sexual Content '
                                        )
                                    ),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'li',
                                        { 'class': '' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'a',
                                            { href: loginURL, role: 'menuitem' },
                                            'Spam, Scam or Fraud '
                                        )
                                    ),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'li',
                                        { 'class': '' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'a',
                                            { href: loginURL, role: 'menuitem' },
                                            'Broken or Empty Data                '
                                        )
                                    )
                                )
                            ),
                            ' '
                        ),
                        ' '
                    )
                ),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'col-sm-8 thats-left item-details-metadata' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'h1',
                        { style: { fontSize: "30px", "marginBottom": 0 } },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'left-icon' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: `${iconochiveIcon} ${mediatype}`, 'aria-hidden': 'true' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                {
                                    'class': 'sr-only' },
                                mediatype
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'span',
                            { itemprop: 'name' },
                            title
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'class': 'actions-ia' }),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'key-val-big' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            null,
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'key' },
                                'by'
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'value' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    null,
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'a',
                                        { onClick: `Nav.nav_search('creator=\"${creator}\"')` },
                                        creator
                                    )
                                )
                            )
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'key-val-big' },
                        'Publication date ',
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'a',
                            { onClick: 'Nav.nav_search(\'date:{datePublished}\')' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { itemprop: 'datePublished' },
                                datePublished
                            )
                        )
                    ),
                    licence ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'key-val-big' },
                        'Usage ',
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'a',
                            { rel: 'license', title: 'http://creativecommons.org/licenses/by-nc-nd/2.0/',
                                href: 'http://creativecommons.org/licenses/by-nc-nd/2.0/', target: '_blank' },
                            'http://creativecommons.org/licenses/by-nc-nd/2.0/',
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', {
                                'class': 'cclic', src: 'https://archive.org/images/cc/cc.png' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { 'class': 'cclic', src: 'https://archive.org/images/cc/by.png' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', {
                                'class': 'cclic', src: 'https://archive.org/images/cc/nc.png' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { 'class': 'cclic', src: 'https://archive.org/images/cc/nd.png' })
                        )
                    ) : undefined,
                    keywords ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'key-val-big' },
                        'Topics ',
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'span',
                            { itemprop: 'keywords' },
                            keywords.map(keyword => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { onClick: `Nav.nav_search('subject=\"${keyword}\"')` },
                                keyword
                            ))
                        ),
                        ' '
                    ) : undefined,
                    publisher ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        null,
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'span',
                            { 'class': 'key' },
                            'Publisher'
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'span',
                            {
                                'class': 'value'
                            },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { onClick: `Nav.nav_search('publisher=\"${publisher}\"')` },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    {
                                        itemprop: 'publisher' },
                                    publisher
                                )
                            )
                        )
                    ) : undefined,
                    contributor ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        null,
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'span',
                            { 'class': 'key' },
                            'Contributor'
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'span',
                            { 'class': 'value' },
                            contributor
                        )
                    ) : undefined,
                    languageAbbrev ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'key-val-big' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            null,
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'key' },
                                'Language'
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'value' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    null,
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'a',
                                        { onClick: `Nav.nav_search('language=(\"${languageAbbrev}\"+OR+language=\"${languageLong}\")')` },
                                        languageLong
                                    )
                                )
                            )
                        )
                    ) : undefined,
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'class': 'clearfix' }),
                    description ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'descript', itemprop: 'description', dangerouslySetInnerHTML: { __html: description } }) : undefined,
                    credits ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'h2',
                        { style: 'font-size:18px' },
                        'Credits'
                    ) : undefined,
                    credits ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'p',
                        { 'class': 'content' },
                        credits
                    ) : undefined,
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'metadata-expandable-list', role: 'list' },
                        metadataListFound.map(k => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { role: 'listitem' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'key' },
                                metadataListPossible[k]
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { 'class': 'value' },
                                metadata[k]
                            )
                        ))
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { id: 'reviews' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'h2',
                            { style: 'font-size:36px;font-weight:200;border-bottom:1px solid #979797; padding-bottom:5px; margin-top:50px;' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'pull-right', style: 'font-size:14px;font-weight:500;padding-top:14px;' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'a',
                                    { 'class': 'stealth', href: writeReviewsURL },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-plus-circle',
                                        'aria-hidden': 'true' }),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        { 'class': 'sr-only' },
                                        'plus-circle'
                                    ),
                                    'Add Review'
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null)
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'left-icon', style: 'margin-top:3px' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-comment',
                                    'aria-hidden': 'true' }),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    { 'class': 'sr-only' },
                                    'comment'
                                )
                            ),
                            'Reviews'
                        ),
                        reviews && reviews.length ? reviews.map(review => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'aReview' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'b',
                                null,
                                'Reviewer:'
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { onClick: `Nav.nav_details('@${review.reviewer}')`,
                                    'data-event-click-tracking': 'ItemReviews|ReviewerLink' },
                                review.reviewer
                            ),
                            '-',
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'span',
                                { alt: `${review.stars} out of 5 stars`, title: `${review.stars} out of 5 stars` },
                                ['*', '*', '*', '*', '*'].slice(0, review.stars).map(x => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-favorite size-75-percent', 'aria-hidden': 'true' }), __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    { 'class': 'sr-only' },
                                    'favorite'
                                ))
                            ),
                            '- ',
                            review.reviewdate,
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'b',
                                null,
                                'Subject:'
                            ),
                            review.reviewtitle,
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'breaker-breaker' },
                                review.reviewbody
                            )
                        )) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'small-label' },
                            'There are no reviews yet. Be the first one to ',
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: writeReviewsURL },
                                'write a review'
                            ),
                            '.'
                        )
                    )
                ),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'col-sm-4 thats-right item-details-archive-info' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'boxy quick-down' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'download-button' },
                            'DOWNLOAD OPTIONS'
                        ),
                        downloadableFiles.map(f => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'format-group' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'summary-rite' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'a',
                                    { 'class': 'stealth', href: `https://archive.org/download/${f.itemid}/${f.metadata.name}`,
                                        title: f.sizePretty },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        { 'class': 'hover-badge-stealth' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-download', 'aria-hidden': 'true' }),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'span',
                                            { 'class': 'sr-only' },
                                            'download'
                                        ),
                                        '1 file'
                                    )
                                )
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { 'class': 'format-summary download-pill',
                                    href: 'https://archive.org/download/${f.itemid}/${f.metadata.name}', title: f.sizePretty,
                                    'data-toggle': 'tooltip', 'data-placement': 'auto left', 'data-container': 'body' },
                                __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].downloadableFormats[f.metadata.format],
                                ' ',
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-download', 'aria-hidden': 'true' }),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'span',
                                    { 'class': 'sr-only' },
                                    'download'
                                )
                            )
                        )),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { 'class': 'show-all' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'pull-right' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'a',
                                    { 'class': 'boxy-ttl hover-badge', href: compressURL },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-download',
                                        'aria-hidden': 'true' }),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        {
                                            'class': 'sr-only' },
                                        'download'
                                    ),
                                    ' ',
                                    filesCount,
                                    ' Files'
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'a',
                                    { 'class': 'boxy-ttl hover-badge', href: compressAllURL },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { 'class': 'iconochive-download',
                                        'aria-hidden': 'true' }),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        {
                                            'class': 'sr-only' },
                                        'download'
                                    ),
                                    ' ',
                                    originalFilesCount,
                                    ' Original'
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null)
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { 'class': 'boxy-ttl', href: downloadURL },
                                'SHOW ALL'
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', { clear: 'all', 'class': 'clearfix' })
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'boxy collection-list' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'section',
                            { 'class': 'quick-down collection-list' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'h5',
                                { 'class': 'collection-title' },
                                'IN COLLECTIONS'
                            ),
                            collections.map(collection => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'collection-item' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'a',
                                    {
                                        onClick: `Nav.nav_details("${collection}")`,
                                        'data-event-click-tracking': `CollectionList|${collection}`
                                    },
                                    collection
                                ),
                                ' '
                            ))
                        )
                    )
                )
            ),
            ' '
        );
    }

    alsoFoundJSX() {
        //TODO-DETAILS this needs implementing, but its another API call - it goes beneath itemDetailsAboutJSX
    }
}
/* harmony export (immutable) */ __webpack_exports__["default"] = Details;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.



/*<replacement>*/

var processNextTick = __webpack_require__(11);
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = __webpack_require__(9);
util.inherits = __webpack_require__(2);
/*</replacement>*/

var Readable = __webpack_require__(21);
var Writable = __webpack_require__(25);

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  processNextTick(cb, err);
};

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

/***/ }),
/* 8 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(21);
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = __webpack_require__(25);
exports.Duplex = __webpack_require__(7);
exports.Transform = __webpack_require__(27);
exports.PassThrough = __webpack_require__(44);


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable node/no-deprecated-api */
var buffer = __webpack_require__(3)
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// var assert = require('assert')
var uint64be = __webpack_require__(59)

var boxes = __webpack_require__(60)

var UINT32_MAX = 4294967295

var Box = exports

/*
 * Lists the proper order for boxes inside containers.
 * Five-character names ending in 's' indicate arrays instead of single elements.
 */
var containers = exports.containers = {
  'moov': ['mvhd', 'meta', 'traks', 'mvex'],
  'trak': ['tkhd', 'tref', 'trgr', 'edts', 'meta', 'mdia', 'udta'],
  'edts': ['elst'],
  'mdia': ['mdhd', 'hdlr', 'elng', 'minf'],
  'minf': ['vmhd', 'smhd', 'hmhd', 'sthd', 'nmhd', 'dinf', 'stbl'],
  'dinf': ['dref'],
  'stbl': ['stsd', 'stts', 'ctts', 'cslg', 'stsc', 'stsz', 'stz2', 'stco', 'co64', 'stss', 'stsh', 'padb', 'stdp', 'sdtp', 'sbgps', 'sgpds', 'subss', 'saizs', 'saios'],
  'mvex': ['mehd', 'trexs', 'leva'],
  'moof': ['mfhd', 'meta', 'trafs'],
  'traf': ['tfhd', 'trun', 'sbgps', 'sgpds', 'subss', 'saizs', 'saios', 'tfdt', 'meta']
}

Box.encode = function (obj, buffer, offset) {
  Box.encodingLength(obj) // sets every level appropriately
  offset = offset || 0
  buffer = buffer || new Buffer(obj.length)
  return Box._encode(obj, buffer, offset)
}

Box._encode = function (obj, buffer, offset) {
  var type = obj.type
  var len = obj.length
  if (len > UINT32_MAX) {
    len = 1
  }
  buffer.writeUInt32BE(len, offset)
  buffer.write(obj.type, offset + 4, 4, 'ascii')
  var ptr = offset + 8
  if (len === 1) {
    uint64be.encode(obj.length, buffer, ptr)
    ptr += 8
  }
  if (boxes.fullBoxes[type]) {
    buffer.writeUInt32BE(obj.flags || 0, ptr)
    buffer.writeUInt8(obj.version || 0, ptr)
    ptr += 4
  }

  if (containers[type]) {
    var contents = containers[type]
    contents.forEach(function (childType) {
      if (childType.length === 5) {
        var entry = obj[childType] || []
        childType = childType.substr(0, 4)
        entry.forEach(function (child) {
          Box._encode(child, buffer, ptr)
          ptr += Box.encode.bytes
        })
      } else if (obj[childType]) {
        Box._encode(obj[childType], buffer, ptr)
        ptr += Box.encode.bytes
      }
    })
    if (obj.otherBoxes) {
      obj.otherBoxes.forEach(function (child) {
        Box._encode(child, buffer, ptr)
        ptr += Box.encode.bytes
      })
    }
  } else if (boxes[type]) {
    var encode = boxes[type].encode
    encode(obj, buffer, ptr)
    ptr += encode.bytes
  } else if (obj.buffer) {
    var buf = obj.buffer
    buf.copy(buffer, ptr)
    ptr += obj.buffer.length
  } else {
    throw new Error('Either `type` must be set to a known type (not\'' + type + '\') or `buffer` must be set')
  }

  Box.encode.bytes = ptr - offset
  // assert.equal(ptr - offset, obj.length, 'Error encoding \'' + type + '\': wrote ' + ptr - offset + ' bytes, expecting ' + obj.length)
  return buffer
}

/*
 * Returns an object with `type` and `size` fields,
 * or if there isn't enough data, returns the total
 * number of bytes needed to read the headers
 */
Box.readHeaders = function (buffer, start, end) {
  start = start || 0
  end = end || buffer.length
  if (end - start < 8) {
    return 8
  }

  var len = buffer.readUInt32BE(start)
  var type = buffer.toString('ascii', start + 4, start + 8)
  var ptr = start + 8

  if (len === 1) {
    if (end - start < 16) {
      return 16
    }

    len = uint64be.decode(buffer, ptr)
    ptr += 8
  }

  var version
  var flags
  if (boxes.fullBoxes[type]) {
    version = buffer.readUInt8(ptr)
    flags = buffer.readUInt32BE(ptr) & 0xffffff
    ptr += 4
  }

  return {
    length: len,
    headersLen: ptr - start,
    contentLen: len - (ptr - start),
    type: type,
    version: version,
    flags: flags
  }
}

Box.decode = function (buffer, start, end) {
  start = start || 0
  end = end || buffer.length
  var headers = Box.readHeaders(buffer, start, end)
  if (!headers || headers.length > end - start) {
    throw new Error('Data too short')
  }

  return Box.decodeWithoutHeaders(headers, buffer, start + headers.headersLen, start + headers.length)
}

Box.decodeWithoutHeaders = function (headers, buffer, start, end) {
  start = start || 0
  end = end || buffer.length
  var type = headers.type
  var obj = {}
  if (containers[type]) {
    obj.otherBoxes = []
    var contents = containers[type]
    var ptr = start
    while (end - ptr >= 8) {
      var child = Box.decode(buffer, ptr, end)
      ptr += child.length
      if (contents.indexOf(child.type) >= 0) {
        obj[child.type] = child
      } else if (contents.indexOf(child.type + 's') >= 0) {
        var childType = child.type + 's'
        var entry = obj[childType] = obj[childType] || []
        entry.push(child)
      } else {
        obj.otherBoxes.push(child)
      }
    }
  } else if (boxes[type]) {
    var decode = boxes[type].decode
    obj = decode(buffer, start, end)
  } else {
    obj.buffer = new Buffer(buffer.slice(start, end))
  }

  obj.length = headers.length
  obj.contentLen = headers.contentLen
  obj.type = headers.type
  obj.version = headers.version
  obj.flags = headers.flags
  return obj
}

Box.encodingLength = function (obj) {
  var type = obj.type

  var len = 8
  if (boxes.fullBoxes[type]) {
    len += 4
  }

  if (containers[type]) {
    var contents = containers[type]
    contents.forEach(function (childType) {
      if (childType.length === 5) {
        var entry = obj[childType] || []
        childType = childType.substr(0, 4)
        entry.forEach(function (child) {
          child.type = childType
          len += Box.encodingLength(child)
        })
      } else if (obj[childType]) {
        var child = obj[childType]
        child.type = childType
        len += Box.encodingLength(child)
      }
    })
    if (obj.otherBoxes) {
      obj.otherBoxes.forEach(function (child) {
        len += Box.encodingLength(child)
      })
    }
  } else if (boxes[type]) {
    len += boxes[type].encodingLength(obj)
  } else if (obj.buffer) {
    len += obj.buffer.length
  } else {
    throw new Error('Either `type` must be set to a known type (not\'' + type + '\') or `buffer` must be set')
  }

  if (len > UINT32_MAX) {
    len += 8
  }

  obj.length = len
  return len
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Tile__ = __webpack_require__(65);


__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!





/* Section to ensure node and browser able to use Headers, Request and Fetch */
/*
var fetch,Headers,Request;
if (typeof(Window) === "undefined") {
    //var fetch = require('whatwg-fetch').fetch; //Not as good as node-fetch-npm, but might be the polyfill needed for browser.safari
    //XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // Note this doesnt work if set to a var or const, needed by whatwg-fetch
    console.log("Node loaded");
    fetch = nodefetch;
    Headers = fetch.Headers;      // A class
    Request = fetch.Request;      // A class
} else {
    // If on a browser, need to find fetch,Headers,Request in window
    console.log("Loading browser version of fetch,Headers,Request");
    fetch = window.fetch;
    Headers = window.Headers;
    Request = window.Request;
}
*/

class Search extends __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__["a" /* default */] {
    /*
    Superclass for Searches - including Collections & Home
     Fields:
    Inherited from ArchiveBase: item
    items   List of items found
     */
    constructor({ query = '*:*', sort = '', and = '', limit = 75, banner = '', page = 1, item = undefined, itemid = undefined } = {}) {
        super(itemid, { item: item });
        this.query = query;
        this.limit = limit;
        this.sort = sort;
        this.and = and;
        this.page = page;
    }

    navwrapped() {
        /* Wrap the content up: wrap ( TODO-DONATE | navwrap |
        TODO-DETAILS need stuff before nav-wrap1 and after detailsabout and need to check this against Search and Collection examples
        returns:      JSX elements tree suitable for passing to ReactDOM.render or ReactDOMServer.renderToStaticMarkup
         */
        //TODO-DETAILS is putting the description (in 'htm' in as raw html which would be a nasty security hole since that comes from user !
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'wrap' },
            new Nav().navwrapJSX(),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { 'class': 'container container-ia' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('a', { name: 'maincontent', id: 'maincontent' })
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { className: 'container container-ia' },
                this.banner(),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { className: 'col-xs-12' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'ikind-search', className: 'ikind in' },
                            this.items.map(function (item, n) {
                                // Note rendering tiles is quick, its the fetch of the img (async) which is slow.
                                return new __WEBPACK_IMPORTED_MODULE_3__Tile__["a" /* default */]().render(item);
                            })
                        )
                    )
                )
            )
        );
    }

    archive_setup_push() {
        archive_setup.push(function () {
            AJS.date_switcher(`&nbsp;<a href="/search.php?query=${query}&amp;sort=-publicdate"><div class="date_switcher in">Date Archived</div></a> <a href="/search.php?query=${query}&amp;sort=-date"><div class="date_switcher">Date Published</div></a> <a href="/search.php?query=${query}&amp;sort=-reviewdate"><div class="date_switcher">Date Reviewed</div></a> `);
        });
        archive_setup.push(function () {
            //TODO-DETAILS check not pushing on top of existing (it probably is)
            AJS.lists_v_tiles_setup('search');
            AJS.popState('search');
            $('div.ikind').css({ visibility: 'visible' });
            AJS.tiler(); // Note Traceys code had AJS.tiler('#ikind-search') but Search and Collections examples have it with no args
            $(window).on('resize  orientationchange', function (evt) {
                clearTimeout(AJS.node_search_throttler);
                AJS.node_search_throttler = setTimeout(AJS.tiler, 250);
            });
            // register for scroll updates (for infinite search results)
            $(window).scroll(AJS.scrolled);
        });
    }
    browserBefore() {
        $('body').addClass('bgEEE');
    }
    banner() {
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'h1',
            null,
            'Search: ',
            this.query
        );
    }

}
/* harmony export (immutable) */ __webpack_exports__["default"] = Search;


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_prettier_bytes__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_prettier_bytes___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_prettier_bytes__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_render_media__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_render_media___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_render_media__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_throttleit__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_throttleit___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_throttleit__);



__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!




class ArchiveFile {
    /*
    Represents a single file, currently one that is in the item, but might create sub/super classes to handle other types
    of file e.g. images used in the UI
     Fields:
    metadata: metadata of item - (note will be a pointer into a Detail or Search's metadata so treat as read-only)
    sd: pointer to SmartDict or Block ? created with Urls (see how did it with Academic)
     */

    constructor({ itemid = undefined, metadata = undefined } = {}) {
        this.itemid = itemid;
        this.metadata = metadata;
    }
    async p_loadImg(jsx) {
        /*
        This is the asyncronous part of loadImg, runs in the background to update the image.
        It gets a static (non stream) content and puts in an existing IMG tag.
         Note it can't be inside load_img which has to be synchronous and return a jsx tree.
         */
        let urls = [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash]; // Multiple potential sources
        let blk = await Dweb.Block.p_fetch(urls, verbose); //Typically will be a Uint8Array
        let blob = new Blob([blk._data], { type: __WEBPACK_IMPORTED_MODULE_3__Util__["a" /* default */].archiveMimeTypeFromFormat[this.metadata.format] }); // Works for data={Uint8Array|Blob}
        // This next code is bizarre combination needed to open a blob from within an HTML window.
        let objectURL = URL.createObjectURL(blob);
        if (verbose) console.log("Blob URL=", objectURL);
        //jsx.src = `http://archive.org/download/${this.itemid}/${this.metadata.name}`
        jsx.src = objectURL;
    }
    async p_loadStream(jsx) {
        let urls = [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash]; // Multiple potential sources
        var file = {
            name: this.metadata.name,
            createReadStream: function (opts) {
                // Return a readable stream that provides the bytes between offsets "start"
                // and "end" inclusive. This works just like fs.createReadStream(opts) from
                // the node.js "fs" module.

                return Dweb.Transports.createReadStream(urls, opts, verbose);
            }
        };

        __WEBPACK_IMPORTED_MODULE_1_render_media___default.a.render(file, jsx); // Render into supplied element

        // TODO: port this to JSX
        if (window.WEBTORRENT_TORRENT) {
            const torrent = window.WEBTORRENT_TORRENT;

            const updateSpeed = () => {
                const webtorrentStats = document.querySelector('#webtorrentStats'); // Not moved into updateSpeed as not in document when this is run first time
                var progress = (100 * torrent.progress).toFixed(1);

                const html = '<b>Peers:</b> ' + torrent.numPeers + ' ' + '<b>Progress:</b> ' + progress + '% ' + '<b>Download speed:</b> ' + __WEBPACK_IMPORTED_MODULE_0_prettier_bytes___default()(torrent.downloadSpeed) + '/s ' + '<b>Upload speed:</b> ' + __WEBPACK_IMPORTED_MODULE_0_prettier_bytes___default()(torrent.uploadSpeed) + '/s';

                if (webtorrentStats) webtorrentStats.innerHTML = html; // May be null during loading, or not in UI
            };

            torrent.on('download', __WEBPACK_IMPORTED_MODULE_4_throttleit___default()(updateSpeed, 250));
            torrent.on('upload', __WEBPACK_IMPORTED_MODULE_4_throttleit___default()(updateSpeed, 250));
            setInterval(updateSpeed, 1000);
            updateSpeed();
        }
    }
    loadImg(jsx) {
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        // Usage like  {this.loadImg(<img width=10>))
        this.p_loadImg(jsx); /* Asynchronously load image*/
        return jsx;
    }
    loadStream(jsx) {
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        // Usage like  {this.loadImg(<img width=10>))
        this.p_loadStream(jsx); /* Asynchronously load image*/
        return jsx;
    }
    downloadable() {
        return Object.keys(__WEBPACK_IMPORTED_MODULE_3__Util__["a" /* default */].downloadableFormats).includes(this.metadata.format);
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ArchiveFile;


/***/ }),
/* 16 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var wrappy = __webpack_require__(49)
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}


/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports = prettierBytes

function prettierBytes (num) {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new TypeError('Expected a number, got ' + typeof num)
  }

  var neg = num < 0
  var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (neg) {
    num = -num
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' B'
  }

  var exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
  num = Number(num / Math.pow(1000, exponent))
  var unit = units[exponent]

  if (num >= 10 || num % 1 === 0) {
    // Do not show decimals when the number is two-digit, or if the number has no
    // decimal component.
    return (neg ? '-' : '') + num.toFixed(0) + ' ' + unit
  } else {
    return (neg ? '-' : '') + num.toFixed(1) + ' ' + unit
  }
}


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

exports.render = render
exports.append = append
exports.mime = __webpack_require__(32)

var debug = __webpack_require__(33)('render-media')
var isAscii = __webpack_require__(36)
var MediaElementWrapper = __webpack_require__(20)
var path = __webpack_require__(46)
var streamToBlobURL = __webpack_require__(47)
var videostream = __webpack_require__(50)

var VIDEOSTREAM_EXTS = [
  '.m4a',
  '.m4v',
  '.mp4'
]

var MEDIASOURCE_VIDEO_EXTS = [
  '.m4v',
  '.mkv',
  '.mp4',
  '.webm'
]

var MEDIASOURCE_AUDIO_EXTS = [
  '.m4a',
  '.mp3'
]

var MEDIASOURCE_EXTS = [].concat(
  MEDIASOURCE_VIDEO_EXTS,
  MEDIASOURCE_AUDIO_EXTS
)

var AUDIO_EXTS = [
  '.aac',
  '.oga',
  '.ogg',
  '.wav'
]

var IMAGE_EXTS = [
  '.bmp',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg'
]

var IFRAME_EXTS = [
  '.css',
  '.html',
  '.js',
  '.md',
  '.pdf',
  '.txt'
]

// Maximum file length for which the Blob URL strategy will be attempted
// See: https://github.com/feross/render-media/issues/18
var MAX_BLOB_LENGTH = 200 * 1000 * 1000 // 200 MB

var MediaSource = typeof window !== 'undefined' && window.MediaSource

function render (file, elem, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  if (!cb) cb = function () {}

  validateFile(file)
  parseOpts(opts)

  if (typeof elem === 'string') elem = document.querySelector(elem)

  renderMedia(file, function (tagName) {
    if (elem.nodeName !== tagName.toUpperCase()) {
      var extname = path.extname(file.name).toLowerCase()

      throw new Error(
        'Cannot render "' + extname + '" inside a "' +
        elem.nodeName.toLowerCase() + '" element, expected "' + tagName + '"'
      )
    }

    return elem
  }, opts, cb)
}

function append (file, rootElem, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  if (!cb) cb = function () {}

  validateFile(file)
  parseOpts(opts)

  if (typeof rootElem === 'string') rootElem = document.querySelector(rootElem)

  if (rootElem && (rootElem.nodeName === 'VIDEO' || rootElem.nodeName === 'AUDIO')) {
    throw new Error(
      'Invalid video/audio node argument. Argument must be root element that ' +
      'video/audio tag will be appended to.'
    )
  }

  renderMedia(file, getElem, opts, done)

  function getElem (tagName) {
    if (tagName === 'video' || tagName === 'audio') return createMedia(tagName)
    else return createElem(tagName)
  }

  function createMedia (tagName) {
    var elem = createElem(tagName)
    if (opts.controls) elem.controls = true
    if (opts.autoplay) elem.autoplay = true
    rootElem.appendChild(elem)
    return elem
  }

  function createElem (tagName) {
    var elem = document.createElement(tagName)
    rootElem.appendChild(elem)
    return elem
  }

  function done (err, elem) {
    if (err && elem) elem.remove()
    cb(err, elem)
  }
}

function renderMedia (file, getElem, opts, cb) {
  var extname = path.extname(file.name).toLowerCase()
  var currentTime = 0
  var elem

  if (MEDIASOURCE_EXTS.indexOf(extname) >= 0) {
    renderMediaSource()
  } else if (AUDIO_EXTS.indexOf(extname) >= 0) {
    renderAudio()
  } else if (IMAGE_EXTS.indexOf(extname) >= 0) {
    renderImage()
  } else if (IFRAME_EXTS.indexOf(extname) >= 0) {
    renderIframe()
  } else {
    tryRenderIframe()
  }

  function renderMediaSource () {
    var tagName = MEDIASOURCE_VIDEO_EXTS.indexOf(extname) >= 0 ? 'video' : 'audio'

    if (MediaSource) {
      if (VIDEOSTREAM_EXTS.indexOf(extname) >= 0) {
        useVideostream()
      } else {
        useMediaSource()
      }
    } else {
      useBlobURL()
    }

    function useVideostream () {
      debug('Use `videostream` package for ' + file.name)
      prepareElem()
      elem.addEventListener('error', fallbackToMediaSource)
      elem.addEventListener('loadstart', onLoadStart)
      elem.addEventListener('canplay', onCanPlay)
      videostream(file, elem)
    }

    function useMediaSource () {
      debug('Use MediaSource API for ' + file.name)
      prepareElem()
      elem.addEventListener('error', fallbackToBlobURL)
      elem.addEventListener('loadstart', onLoadStart)
      elem.addEventListener('canplay', onCanPlay)

      var wrapper = new MediaElementWrapper(elem)
      var writable = wrapper.createWriteStream(getCodec(file.name))
      file.createReadStream().pipe(writable)

      if (currentTime) elem.currentTime = currentTime
    }

    function useBlobURL () {
      debug('Use Blob URL for ' + file.name)
      prepareElem()
      elem.addEventListener('error', fatalError)
      elem.addEventListener('loadstart', onLoadStart)
      elem.addEventListener('canplay', onCanPlay)
      getBlobURL(file, function (err, url) {
        if (err) return fatalError(err)
        elem.src = url
        if (currentTime) elem.currentTime = currentTime
      })
    }

    function fallbackToMediaSource (err) {
      debug('videostream error: fallback to MediaSource API: %o', err.message || err)
      elem.removeEventListener('error', fallbackToMediaSource)
      elem.removeEventListener('canplay', onCanPlay)

      useMediaSource()
    }

    function fallbackToBlobURL (err) {
      debug('MediaSource API error: fallback to Blob URL: %o', err.message || err)

      if (typeof file.length === 'number' && file.length > opts.maxBlobLength) {
        debug(
          'File length too large for Blob URL approach: %d (max: %d)',
          file.length, opts.maxBlobLength
        )
        return fatalError(new Error(
          'File length too large for Blob URL approach: ' + file.length +
          ' (max: ' + opts.maxBlobLength + ')'
        ))
      }

      elem.removeEventListener('error', fallbackToBlobURL)
      elem.removeEventListener('canplay', onCanPlay)

      useBlobURL()
    }

    function prepareElem () {
      if (!elem) {
        elem = getElem(tagName)

        elem.addEventListener('progress', function () {
          currentTime = elem.currentTime
        })
      }
    }
  }

  function renderAudio () {
    elem = getElem('audio')
    getBlobURL(file, function (err, url) {
      if (err) return fatalError(err)
      elem.addEventListener('error', fatalError)
      elem.addEventListener('loadstart', onLoadStart)
      elem.addEventListener('canplay', onCanPlay)
      elem.src = url
    })
  }

  function onLoadStart () {
    elem.removeEventListener('loadstart', onLoadStart)
    if (opts.autoplay) elem.play()
  }

  function onCanPlay () {
    elem.removeEventListener('canplay', onCanPlay)
    cb(null, elem)
  }

  function renderImage () {
    elem = getElem('img')
    getBlobURL(file, function (err, url) {
      if (err) return fatalError(err)
      elem.src = url
      elem.alt = file.name
      cb(null, elem)
    })
  }

  function renderIframe () {
    elem = getElem('iframe')

    getBlobURL(file, function (err, url) {
      if (err) return fatalError(err)
      elem.src = url
      if (extname !== '.pdf') elem.sandbox = 'allow-forms allow-scripts'
      cb(null, elem)
    })
  }

  function tryRenderIframe () {
    debug('Unknown file extension "%s" - will attempt to render into iframe', extname)

    var str = ''
    file.createReadStream({ start: 0, end: 1000 })
      .setEncoding('utf8')
      .on('data', function (chunk) {
        str += chunk
      })
      .on('end', done)
      .on('error', cb)

    function done () {
      if (isAscii(str)) {
        debug('File extension "%s" appears ascii, so will render.', extname)
        renderIframe()
      } else {
        debug('File extension "%s" appears non-ascii, will not render.', extname)
        cb(new Error('Unsupported file type "' + extname + '": Cannot append to DOM'))
      }
    }
  }

  function fatalError (err) {
    err.message = 'Error rendering file "' + file.name + '": ' + err.message
    debug(err.message)
    cb(err)
  }
}

function getBlobURL (file, cb) {
  var extname = path.extname(file.name).toLowerCase()
  streamToBlobURL(file.createReadStream(), exports.mime[extname], cb)
}

function validateFile (file) {
  if (file == null) {
    throw new Error('file cannot be null or undefined')
  }
  if (typeof file.name !== 'string') {
    throw new Error('missing or invalid file.name property')
  }
  if (typeof file.createReadStream !== 'function') {
    throw new Error('missing or invalid file.createReadStream property')
  }
}

function getCodec (name) {
  var extname = path.extname(name).toLowerCase()
  return {
    '.m4a': 'audio/mp4; codecs="mp4a.40.5"',
    '.m4v': 'video/mp4; codecs="avc1.640029, mp4a.40.5"',
    '.mkv': 'video/webm; codecs="avc1.640029, mp4a.40.5"',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4; codecs="avc1.640029, mp4a.40.5"',
    '.webm': 'video/webm; codecs="vorbis, vp8"'
  }[extname]
}

function parseOpts (opts) {
  if (opts.autoplay == null) opts.autoplay = true
  if (opts.controls == null) opts.controls = true
  if (opts.maxBlobLength == null) opts.maxBlobLength = MAX_BLOB_LENGTH
}


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = MediaElementWrapper

var inherits = __webpack_require__(2)
var stream = __webpack_require__(10)
var toArrayBuffer = __webpack_require__(45)

var MediaSource = typeof window !== 'undefined' && window.MediaSource

var DEFAULT_BUFFER_DURATION = 60 // seconds

function MediaElementWrapper (elem, opts) {
  var self = this
  if (!(self instanceof MediaElementWrapper)) return new MediaElementWrapper(elem, opts)

  if (!MediaSource) throw new Error('web browser lacks MediaSource support')

  if (!opts) opts = {}
  self._bufferDuration = opts.bufferDuration || DEFAULT_BUFFER_DURATION
  self._elem = elem
  self._mediaSource = new MediaSource()
  self._streams = []
  self.detailedError = null

  self._errorHandler = function () {
    self._elem.removeEventListener('error', self._errorHandler)
    var streams = self._streams.slice()
    streams.forEach(function (stream) {
      stream.destroy(self._elem.error)
    })
  }
  self._elem.addEventListener('error', self._errorHandler)

  self._elem.src = window.URL.createObjectURL(self._mediaSource)
}

/*
 * `obj` can be a previous value returned by this function
 * or a string
 */
MediaElementWrapper.prototype.createWriteStream = function (obj) {
  var self = this

  return new MediaSourceStream(self, obj)
}

/*
 * Use to trigger an error on the underlying media element
 */
MediaElementWrapper.prototype.error = function (err) {
  var self = this

  // be careful not to overwrite any existing detailedError values
  if (!self.detailedError) {
    self.detailedError = err
  }
  try {
    self._mediaSource.endOfStream('decode')
  } catch (err) {}
}

inherits(MediaSourceStream, stream.Writable)

function MediaSourceStream (wrapper, obj) {
  var self = this
  stream.Writable.call(self)

  self._wrapper = wrapper
  self._elem = wrapper._elem
  self._mediaSource = wrapper._mediaSource
  self._allStreams = wrapper._streams
  self._allStreams.push(self)
  self._bufferDuration = wrapper._bufferDuration
  self._sourceBuffer = null

  self._openHandler = function () {
    self._onSourceOpen()
  }
  self._flowHandler = function () {
    self._flow()
  }

  if (typeof obj === 'string') {
    self._type = obj
    // Need to create a new sourceBuffer
    if (self._mediaSource.readyState === 'open') {
      self._createSourceBuffer()
    } else {
      self._mediaSource.addEventListener('sourceopen', self._openHandler)
    }
  } else if (obj._sourceBuffer === null) {
    obj.destroy()
    self._type = obj._type // The old stream was created but hasn't finished initializing
    self._mediaSource.addEventListener('sourceopen', self._openHandler)
  } else if (obj._sourceBuffer) {
    obj.destroy()
    self._type = obj._type
    self._sourceBuffer = obj._sourceBuffer // Copy over the old sourceBuffer
    self._sourceBuffer.addEventListener('updateend', self._flowHandler)
  } else {
    throw new Error('The argument to MediaElementWrapper.createWriteStream must be a string or a previous stream returned from that function')
  }

  self._elem.addEventListener('timeupdate', self._flowHandler)

  self.on('error', function (err) {
    self._wrapper.error(err)
  })

  self.on('finish', function () {
    if (self.destroyed) return
    self._finished = true
    if (self._allStreams.every(function (other) { return other._finished })) {
      try {
        self._mediaSource.endOfStream()
      } catch (err) {}
    }
  })
}

MediaSourceStream.prototype._onSourceOpen = function () {
  var self = this
  if (self.destroyed) return

  self._mediaSource.removeEventListener('sourceopen', self._openHandler)
  self._createSourceBuffer()
}

MediaSourceStream.prototype.destroy = function (err) {
  var self = this
  if (self.destroyed) return
  self.destroyed = true

  // Remove from allStreams
  self._allStreams.splice(self._allStreams.indexOf(self), 1)

  self._mediaSource.removeEventListener('sourceopen', self._openHandler)
  self._elem.removeEventListener('timeupdate', self._flowHandler)
  if (self._sourceBuffer) {
    self._sourceBuffer.removeEventListener('updateend', self._flowHandler)
    if (self._mediaSource.readyState === 'open') {
      self._sourceBuffer.abort()
    }
  }

  if (err) self.emit('error', err)
  self.emit('close')
}

MediaSourceStream.prototype._createSourceBuffer = function () {
  var self = this
  if (self.destroyed) return

  if (MediaSource.isTypeSupported(self._type)) {
    self._sourceBuffer = self._mediaSource.addSourceBuffer(self._type)
    self._sourceBuffer.addEventListener('updateend', self._flowHandler)
    if (self._cb) {
      var cb = self._cb
      self._cb = null
      cb()
    }
  } else {
    self.destroy(new Error('The provided type is not supported'))
  }
}

MediaSourceStream.prototype._write = function (chunk, encoding, cb) {
  var self = this
  if (self.destroyed) return
  if (!self._sourceBuffer) {
    self._cb = function (err) {
      if (err) return cb(err)
      self._write(chunk, encoding, cb)
    }
    return
  }

  if (self._sourceBuffer.updating) {
    return cb(new Error('Cannot append buffer while source buffer updating'))
  }

  try {
    self._sourceBuffer.appendBuffer(toArrayBuffer(chunk))
  } catch (err) {
    // appendBuffer can throw for a number of reasons, most notably when the data
    // being appended is invalid or if appendBuffer is called after another error
    // already occurred on the media element. In Chrome, there may be useful debugging
    // info in chrome://media-internals
    self.destroy(err)
    return
  }
  self._cb = cb
}

MediaSourceStream.prototype._flow = function () {
  var self = this

  if (self.destroyed || !self._sourceBuffer || self._sourceBuffer.updating) {
    return
  }

  if (self._mediaSource.readyState === 'open') {
    // check buffer size
    if (self._getBufferDuration() > self._bufferDuration) {
      return
    }
  }

  if (self._cb) {
    var cb = self._cb
    self._cb = null
    cb()
  }
}

// TODO: if zero actually works in all browsers, remove the logic associated with this below
var EPSILON = 0

MediaSourceStream.prototype._getBufferDuration = function () {
  var self = this

  var buffered = self._sourceBuffer.buffered
  var currentTime = self._elem.currentTime
  var bufferEnd = -1 // end of the buffer
  // This is a little over complex because some browsers seem to separate the
  // buffered region into multiple sections with slight gaps.
  for (var i = 0; i < buffered.length; i++) {
    var start = buffered.start(i)
    var end = buffered.end(i) + EPSILON

    if (start > currentTime) {
      // Reached past the joined buffer
      break
    } else if (bufferEnd >= 0 || currentTime <= end) {
      // Found the start/continuation of the joined buffer
      bufferEnd = end
    }
  }

  var bufferedTime = bufferEnd - currentTime
  if (bufferedTime < 0) {
    bufferedTime = 0
  }

  return bufferedTime
}


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/

var processNextTick = __webpack_require__(11);
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = __webpack_require__(22);
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = __webpack_require__(16).EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(23);
/*</replacement>*/

// TODO(bmeurer): Change this back to const once hole checks are
// properly optimized away early in Ignition+TurboFan.
/*<replacement>*/
var Buffer = __webpack_require__(12).Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*</replacement>*/

/*<replacement>*/
var util = __webpack_require__(9);
util.inherits = __webpack_require__(2);
/*</replacement>*/

/*<replacement>*/
var debugUtil = __webpack_require__(39);
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = __webpack_require__(40);
var destroyImpl = __webpack_require__(24);
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') {
    return emitter.prependListener(event, fn);
  } else {
    // This is a hack to make sure that our error handler is attached before any
    // userland ones.  NEVER DO THIS. This is here only because this code needs
    // to continue to work with older versions of Node.js that do not include
    // the prependListener() method. The goal is to eventually remove this hack.
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
  }
}

function ReadableState(options, stream) {
  Duplex = Duplex || __webpack_require__(7);

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = __webpack_require__(26).StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || __webpack_require__(7);

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = __webpack_require__(26).StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], self.emit.bind(self, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8), __webpack_require__(5)))

/***/ }),
/* 22 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(16).EventEmitter;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*<replacement>*/

var processNextTick = __webpack_require__(11);
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      processNextTick(emitErrorNT, this, err);
    }
    return;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      processNextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process, setImmediate, global) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.



/*<replacement>*/

var processNextTick = __webpack_require__(11);
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = __webpack_require__(9);
util.inherits = __webpack_require__(2);
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: __webpack_require__(43)
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(23);
/*</replacement>*/

/*<replacement>*/
var Buffer = __webpack_require__(12).Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*</replacement>*/

var destroyImpl = __webpack_require__(24);

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || __webpack_require__(7);

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || __webpack_require__(7);

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = _isUint8Array(chunk) && !state.objectMode;

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    processNextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    processNextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      processNextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5), __webpack_require__(41).setImmediate, __webpack_require__(8)))

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Buffer = __webpack_require__(12).Buffer;

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return -1;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// UTF-8 replacement characters ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd'.repeat(p);
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd'.repeat(p + 1);
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd'.repeat(p + 2);
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character for each buffered byte of a (partial)
// character needs to be added to the output.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd'.repeat(this.lastTotal - this.lastNeed);
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.



module.exports = Transform;

var Duplex = __webpack_require__(7);

/*<replacement>*/
var util = __webpack_require__(9);
util.inherits = __webpack_require__(2);
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return stream.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er, data) {
      done(stream, er, data);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data !== null && data !== undefined) stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = throttle;

/**
 * Returns a new function that, when invoked, invokes `func` at most once per `wait` milliseconds.
 *
 * @param {Function} func Function to wrap.
 * @param {Number} wait Number of milliseconds that must elapse between `func` invocations.
 * @return {Function} A new function that wraps the `func` function passed in.
 */

function throttle (func, wait) {
  var ctx, args, rtn, timeoutID; // caching
  var last = 0;

  return function throttled () {
    ctx = this;
    args = arguments;
    var delta = new Date() - last;
    if (!timeoutID)
      if (delta >= wait) call();
      else timeoutID = setTimeout(call, wait - delta);
    return rtn;
  };

  function call () {
    timeoutID = 0;
    last = +new Date();
    rtn = func.apply(ctx, args);
    ctx = null;
    args = null;
  }
}


/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ArchiveItem__ = __webpack_require__(64);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!

//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';
//TODO-DETAILS add a config file, load at compile and make overridable - server etc go there



class ArchiveBase extends __WEBPACK_IMPORTED_MODULE_2__ArchiveItem__["a" /* default */] {
    /*
    Base class for Archive application - base of Details = which includes single element items and Search which includes both searches and collections (which are actually items).
    ArchiveBase
    - Details
    - - AV
    - - Image
    - - Text
    - - Software (not implemented)
    - Search
    - - Home
    - - Collection
    Nav - knows about all the classes (includes factory() but doesnt subclass them
    Util - just some utility functions
    Tile - elements on a Search - each is a ArchiveItem
    ReactFake - spoofs methods of React as otherwise hard to do onclick etc if use real React (note archive.min still uses react a little)
     Fields:
    item    Metadata for item, undefined for a search.
    items   Metadata for items found if the item is a Collection,
    itemtype    Schema.org for this eg. "http://schema.org/TextDigitalDocument"
    query   query part of search to run (Search|Collection|Home only)
     */
    constructor(itemid, { item = undefined } = {}) {
        super({ itemid: itemid, item: item });
    }
    theatreIaWrap() {}

    browserBefore() {
        //Anything that is needed to be executed in the browser before the main HTML tree is replaced.
        // Nothing to do by default
    }
    browserAfter() {
        this.archive_setup_push(); // Subclassed function to setup stuff for after loading.
        __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].AJS_on_dom_loaded(); // Runs code pushed archive_setup - needed for image if "super" this, put it after superclasses
    }
    render(res, htm) {
        //TODO-DETAILS remove htm and from calling routines
        var els = this.navwrapped();
        this.browserBefore();
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].domrender(els, res);
        this.browserAfter();
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ArchiveBase;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

//var React = require('react');
//var ReactDOM = require('react-dom');
var Details = __webpack_require__(6).default;
var Search = __webpack_require__(14).default;
var Nav = __webpack_require__(66).default;
//window.Dweb = require('../js/Dweb');
window.Nav = Nav;
/*
TODO-DETAILS-DIST outline of work

O can I search on contenthash - ask if doesnt work
    If ... DG Add contenthash search

BREW check if should add to metadata and/or search

DT Transport refactor
    For lists ... waiting on S @ Orbit

INCREMENTAL BRANCH
*   Fix content in ia-details-about   <<<#1
    Fix Search to properly match HTML returned by Search & Collection - see examples
    Below item-details
    Above Nav

Make links point at Dweb OR at gateway.dweb.me/content/archiveid/xxx/yyy
    Make React look in tag, and replace with a call

C Fetch from contenthash or ipfs if available
    - embedded images etc - routine plus object pointed to in body
    - NEEDS STREAMS: figure out how AV dispays and how to pass stream to it (maybe wait on Feross)
    - NEEDS STREAMS: figure out how text displays and how to pass stream to it

O Talk to Ferross
    DT Add BitTorrent to library
    DA Recognize magnet links
    DG Add the improvements from the doc

Naming - start implementing - need outline on both DT and DG and DA
    DT implement name

NEEDS PATH: Figure out pushing entire examples dir to ipfs and accessing via paths

Later
    Add other ways to fetch to metadata returned e.g webtorrent
    ArchiveItem - CL - for item
    ArchiveFile - SmartDict - holds metadata
    Make UI display IPFS/HTTP status indicators consistent.


STREAMS - fetches to return streams if req
PATH - URLs with paths in
REACT - React clone to spot img tag
LISTS - support for multiple list transports
*/

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

exports.default = function () {};

module.exports = exports["default"];

/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = {".3gp":"video/3gpp",".aac":"audio/aac",".aif":"audio/x-aiff",".aiff":"audio/x-aiff",".atom":"application/atom+xml",".avi":"video/x-msvideo",".bmp":"image/bmp",".bz2":"application/x-bzip2",".conf":"text/plain",".css":"text/css",".csv":"text/plain",".diff":"text/x-diff",".doc":"application/msword",".flv":"video/x-flv",".gif":"image/gif",".gz":"application/x-gzip",".htm":"text/html",".html":"text/html",".ico":"image/vnd.microsoft.icon",".ics":"text/calendar",".iso":"application/octet-stream",".jar":"application/java-archive",".jpeg":"image/jpeg",".jpg":"image/jpeg",".js":"application/javascript",".json":"application/json",".less":"text/css",".log":"text/plain",".m3u":"audio/x-mpegurl",".m4a":"audio/mp4",".m4v":"video/mp4",".manifest":"text/cache-manifest",".markdown":"text/x-markdown",".mathml":"application/mathml+xml",".md":"text/x-markdown",".mid":"audio/midi",".midi":"audio/midi",".mov":"video/quicktime",".mp3":"audio/mpeg",".mp4":"video/mp4",".mp4v":"video/mp4",".mpeg":"video/mpeg",".mpg":"video/mpeg",".odp":"application/vnd.oasis.opendocument.presentation",".ods":"application/vnd.oasis.opendocument.spreadsheet",".odt":"application/vnd.oasis.opendocument.text",".oga":"audio/ogg",".ogg":"application/ogg",".pdf":"application/pdf",".png":"image/png",".pps":"application/vnd.ms-powerpoint",".ppt":"application/vnd.ms-powerpoint",".ps":"application/postscript",".psd":"image/vnd.adobe.photoshop",".qt":"video/quicktime",".rar":"application/x-rar-compressed",".rdf":"application/rdf+xml",".rss":"application/rss+xml",".rtf":"application/rtf",".svg":"image/svg+xml",".svgz":"image/svg+xml",".swf":"application/x-shockwave-flash",".tar":"application/x-tar",".tbz":"application/x-bzip-compressed-tar",".text":"text/plain",".tif":"image/tiff",".tiff":"image/tiff",".torrent":"application/x-bittorrent",".ttf":"application/x-font-ttf",".txt":"text/plain",".wav":"audio/wav",".webm":"video/webm",".wma":"audio/x-ms-wma",".wmv":"video/x-ms-wmv",".xls":"application/vnd.ms-excel",".xml":"application/xml",".yaml":"text/yaml",".yml":"text/yaml",".zip":"application/zip"}

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(34);
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = __webpack_require__(35);

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}


/***/ }),
/* 35 */
/***/ (function(module, exports) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}


/***/ }),
/* 36 */
/***/ (function(module, exports) {

/* (c) 2016 Ari Porad (@ariporad) <http://ariporad.com>. License: ariporad.mit-license.org */

// Partially from http://stackoverflow.com/a/94049/1928484, and from another SO answer, which told me that the highest
// char code that's ascii is 127, but I can't find the link for. Sorry.

var MAX_ASCII_CHAR_CODE = 127;

module.exports = function isAscii(str) {
  for (var i = 0, strLen = str.length; i < strLen; ++i) {
    if (str.charCodeAt(i) > MAX_ASCII_CHAR_CODE) return false;
  }
  return true;
};


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}


/***/ }),
/* 38 */
/***/ (function(module, exports) {

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),
/* 39 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*<replacement>*/

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = __webpack_require__(12).Buffer;
/*</replacement>*/

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(42);
exports.setImmediate = setImmediate;
exports.clearImmediate = clearImmediate;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8), __webpack_require__(5)))

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {
/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8)))

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.



module.exports = PassThrough;

var Transform = __webpack_require__(27);

/*<replacement>*/
var util = __webpack_require__(9);
util.inherits = __webpack_require__(2);
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(3).Buffer

module.exports = function (buf) {
	// If the buffer is backed by a Uint8Array, a faster version will work
	if (buf instanceof Uint8Array) {
		// If the buffer isn't a subarray, return the underlying ArrayBuffer
		if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
			return buf.buffer
		} else if (typeof buf.buffer.slice === 'function') {
			// Otherwise we need to get a proper copy
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
		}
	}

	if (Buffer.isBuffer(buf)) {
		// This is the slow version that will work with any Buffer
		// implementation (even in old browsers)
		var arrayCopy = new Uint8Array(buf.length)
		var len = buf.length
		for (var i = 0; i < len; i++) {
			arrayCopy[i] = buf[i]
		}
		return arrayCopy.buffer
	} else {
		throw new Error('Argument must be a Buffer')
	}
}


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

/* global URL */

var getBlob = __webpack_require__(48)

module.exports = function getBlobURL (stream, mimeType, cb) {
  if (typeof mimeType === 'function') return getBlobURL(stream, null, mimeType)
  getBlob(stream, mimeType, function (err, blob) {
    if (err) return cb(err)
    var url = URL.createObjectURL(blob)
    cb(null, url)
  })
}


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

/* global Blob */

var once = __webpack_require__(17)

module.exports = function getBlob (stream, mimeType, cb) {
  if (typeof mimeType === 'function') return getBlob(stream, null, mimeType)
  cb = once(cb)
  var chunks = []
  stream
    .on('data', function (chunk) {
      chunks.push(chunk)
    })
    .on('end', function () {
      var blob = mimeType
        ? new Blob(chunks, { type: mimeType })
        : new Blob(chunks)
      cb(null, blob)
    })
    .on('error', cb)
}


/***/ }),
/* 49 */
/***/ (function(module, exports) {

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

var MediaElementWrapper = __webpack_require__(20)
var pump = __webpack_require__(51)

var MP4Remuxer = __webpack_require__(54)

module.exports = VideoStream

function VideoStream (file, mediaElem, opts) {
	var self = this
	if (!(this instanceof VideoStream)) return new VideoStream(file, mediaElem, opts)
	opts = opts || {}

	self.detailedError = null

	self._elem = mediaElem
	self._elemWrapper = new MediaElementWrapper(mediaElem)
	self._waitingFired = false
	self._trackMeta = null
	self._file = file
	self._tracks = null
	if (self._elem.preload !== 'none') {
		self._createMuxer()
	}

	self._onError = function (err) {
		self.detailedError = self._elemWrapper.detailedError
		self.destroy() // don't pass err though so the user doesn't need to listen for errors
	}
	self._onWaiting = function () {
		self._waitingFired = true
		if (!self._muxer) {
			self._createMuxer()
		} else if (self._tracks) {
			self._pump()
		}
	}
	self._elem.addEventListener('waiting', self._onWaiting)
	self._elem.addEventListener('error', self._onError)
}

VideoStream.prototype._createMuxer = function () {
	var self = this
	self._muxer = new MP4Remuxer(self._file)
	self._muxer.on('ready', function (data) {
		self._tracks = data.map(function (trackData) {
			var mediaSource = self._elemWrapper.createWriteStream(trackData.mime)
			mediaSource.on('error', function (err) {
				self._elemWrapper.error(err)
			})
			var track = {
				muxed: null,
				mediaSource: mediaSource,
				initFlushed: false,
				onInitFlushed: null
			}
			mediaSource.write(trackData.init, function (err) {
				track.initFlushed = true
				if (track.onInitFlushed) {
					track.onInitFlushed(err)
				}
			})
			return track
		})

		if (self._waitingFired || self._elem.preload === 'auto') {
			self._pump()
		}
	})

	self._muxer.on('error', function (err) {
		self._elemWrapper.error(err)
	})
}

VideoStream.prototype._pump = function () {
	var self = this

	var muxed = self._muxer.seek(self._elem.currentTime, !self._tracks)

	self._tracks.forEach(function (track, i) {
		var pumpTrack = function () {
			if (track.muxed) {
				track.muxed.destroy()
				track.mediaSource = self._elemWrapper.createWriteStream(track.mediaSource)
				track.mediaSource.on('error', function (err) {
					self._elemWrapper.error(err)
				})
			}
			track.muxed = muxed[i]
			pump(track.muxed, track.mediaSource)
		}
		if (!track.initFlushed) {
			track.onInitFlushed = function (err) {
				if (err) {
					self._elemWrapper.error(err)
					return
				}
				pumpTrack()
			}
		} else {
			pumpTrack()
		}
	})
}

VideoStream.prototype.destroy = function () {
	var self = this
	if (self.destroyed) {
		return
	}
	self.destroyed = true

	self._elem.removeEventListener('waiting', self._onWaiting)
	self._elem.removeEventListener('error', self._onError)

	if (self._tracks) {
		self._tracks.forEach(function (track) {
			track.muxed.destroy()
		})
	}

	self._elem.src = ''
}


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var once = __webpack_require__(17)
var eos = __webpack_require__(52)
var fs = __webpack_require__(53) // we only need fs to get the ReadStream and WriteStream prototypes

var noop = function () {}

var isFn = function (fn) {
  return typeof fn === 'function'
}

var isFS = function (stream) {
  if (!fs) return false // browser
  return (stream instanceof (fs.ReadStream || noop) || stream instanceof (fs.WriteStream || noop)) && isFn(stream.close)
}

var isRequest = function (stream) {
  return stream.setHeader && isFn(stream.abort)
}

var destroyer = function (stream, reading, writing, callback) {
  callback = once(callback)

  var closed = false
  stream.on('close', function () {
    closed = true
  })

  eos(stream, {readable: reading, writable: writing}, function (err) {
    if (err) return callback(err)
    closed = true
    callback()
  })

  var destroyed = false
  return function (err) {
    if (closed) return
    if (destroyed) return
    destroyed = true

    if (isFS(stream)) return stream.close(noop) // use close for fs streams to avoid fd leaks
    if (isRequest(stream)) return stream.abort() // request.destroy just do .end - .abort is what we want

    if (isFn(stream.destroy)) return stream.destroy()

    callback(err || new Error('stream was destroyed'))
  }
}

var call = function (fn) {
  fn()
}

var pipe = function (from, to) {
  return from.pipe(to)
}

var pump = function () {
  var streams = Array.prototype.slice.call(arguments)
  var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop

  if (Array.isArray(streams[0])) streams = streams[0]
  if (streams.length < 2) throw new Error('pump requires two streams per minimum')

  var error
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1
    var writing = i > 0
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err
      if (err) destroys.forEach(call)
      if (reading) return
      destroys.forEach(call)
      callback(error)
    })
  })

  return streams.reduce(pipe)
}

module.exports = pump


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

var once = __webpack_require__(17);

var noop = function() {};

var isRequest = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var isChildProcess = function(stream) {
	return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback.call(stream);
	};

	var onend = function() {
		readable = false;
		if (!writable) callback.call(stream);
	};

	var onexit = function(exitCode) {
		callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
	};

	var onclose = function() {
		if (readable && !(rs && rs.ended)) return callback.call(stream, new Error('premature close'));
		if (writable && !(ws && ws.ended)) return callback.call(stream, new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	if (isChildProcess(stream)) stream.on('exit', onexit);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', callback);
	stream.on('close', onclose);

	return function() {
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('exit', onexit);
		stream.removeListener('end', onend);
		stream.removeListener('error', callback);
		stream.removeListener('close', onclose);
	};
};

module.exports = eos;


/***/ }),
/* 53 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var bs = __webpack_require__(55)
var EventEmitter = __webpack_require__(16).EventEmitter
var inherits = __webpack_require__(2)
var mp4 = __webpack_require__(56)
var Box = __webpack_require__(13)
var RangeSliceStream = __webpack_require__(63)

module.exports = MP4Remuxer

function MP4Remuxer (file) {
	var self = this
	EventEmitter.call(self)
	self._tracks = []
	self._fragmentSequence = 1
	self._file = file
	self._decoder = null
	self._findMoov(0)
}

inherits(MP4Remuxer, EventEmitter)

MP4Remuxer.prototype._findMoov = function (offset) {
	var self = this

	if (self._decoder) {
		self._decoder.destroy()
	}

	self._decoder = mp4.decode()
	var fileStream = self._file.createReadStream({
		start: offset
	})
	fileStream.pipe(self._decoder)

	self._decoder.once('box', function (headers) {
		if (headers.type === 'moov') {
			self._decoder.decode(function (moov) {
				fileStream.destroy()
				try {
					self._processMoov(moov)
				} catch (err) {
					err.message = 'Cannot parse mp4 file: ' + err.message
					self.emit('error', err)
				}
			})
		} else {
			fileStream.destroy()
			self._findMoov(offset + headers.length)
		}
	})
}

function RunLengthIndex (entries, countName) {
	var self = this
	self._entries = entries
	self._countName = countName || 'count'
	self._index = 0
	self._offset = 0

	self.value = self._entries[0]
}

RunLengthIndex.prototype.inc = function () {
	var self = this
	self._offset++
	if (self._offset >= self._entries[self._index][self._countName]) {
		self._index++
		self._offset = 0
	}

	self.value = self._entries[self._index]
}

MP4Remuxer.prototype._processMoov = function (moov) {
	var self = this

	var traks = moov.traks
	self._tracks = []
	self._hasVideo = false
	self._hasAudio = false
	for (var i = 0; i < traks.length; i++) {
		var trak = traks[i]
		var stbl = trak.mdia.minf.stbl
		var stsdEntry = stbl.stsd.entries[0]
		var handlerType = trak.mdia.hdlr.handlerType
		var codec
		var mime
		if (handlerType === 'vide' && stsdEntry.type === 'avc1') {
			if (self._hasVideo) {
				continue
			}
			self._hasVideo = true
			codec = 'avc1'
			if (stsdEntry.avcC) {
				codec += '.' + stsdEntry.avcC.mimeCodec
			}
			mime = 'video/mp4; codecs="' + codec + '"'
		} else if (handlerType === 'soun' && stsdEntry.type === 'mp4a') {
			if (self._hasAudio) {
				continue
			}
			self._hasAudio = true
			codec = 'mp4a'
			if (stsdEntry.esds && stsdEntry.esds.mimeCodec) {
				codec += '.' + stsdEntry.esds.mimeCodec
			}
			mime = 'audio/mp4; codecs="' + codec + '"'
		} else {
			continue
		}

		var samples = []
		var sample = 0

		// Chunk/position data
		var sampleInChunk = 0
		var chunk = 0
		var offsetInChunk = 0
		var sampleToChunkIndex = 0

		// Time data
		var dts = 0
		var decodingTimeEntry = new RunLengthIndex(stbl.stts.entries)
		var presentationOffsetEntry = null
		if (stbl.ctts) {
			presentationOffsetEntry = new RunLengthIndex(stbl.ctts.entries)
		}

		// Sync table index
		var syncSampleIndex = 0

		while (true) {
			var currChunkEntry = stbl.stsc.entries[sampleToChunkIndex]

			// Compute size
			var size = stbl.stsz.entries[sample]

			// Compute time data
			var duration = decodingTimeEntry.value.duration
			var presentationOffset = presentationOffsetEntry ? presentationOffsetEntry.value.compositionOffset : 0

			// Compute sync
			var sync = true
			if (stbl.stss) {
				sync = stbl.stss.entries[syncSampleIndex] === sample + 1
			}

			// Create new sample entry
			samples.push({
				size: size,
				duration: duration,
				dts: dts,
				presentationOffset: presentationOffset,
				sync: sync,
				offset: offsetInChunk + stbl.stco.entries[chunk]
			})

			// Go to next sample
			sample++
			if (sample >= stbl.stsz.entries.length) {
				break
			}

			// Move position/chunk
			sampleInChunk++
			offsetInChunk += size
			if (sampleInChunk >= currChunkEntry.samplesPerChunk) {
				// Move to new chunk
				sampleInChunk = 0
				offsetInChunk = 0
				chunk++
				// Move sample to chunk box index
				var nextChunkEntry = stbl.stsc.entries[sampleToChunkIndex + 1]
				if (nextChunkEntry && chunk + 1 >= nextChunkEntry.firstChunk) {
					sampleToChunkIndex++
				}
			}

			// Move time forward
			dts += duration
			decodingTimeEntry.inc()
			presentationOffsetEntry && presentationOffsetEntry.inc()

			// Move sync table index
			if (sync) {
				syncSampleIndex++
			}
		}

		trak.mdia.mdhd.duration = 0
		trak.tkhd.duration = 0

		var defaultSampleDescriptionIndex = currChunkEntry.sampleDescriptionId

		var trackMoov = {
			type: 'moov',
			mvhd: moov.mvhd,
			traks: [{
				tkhd: trak.tkhd,
				mdia: {
					mdhd: trak.mdia.mdhd,
					hdlr: trak.mdia.hdlr,
					elng: trak.mdia.elng,
					minf: {
						vmhd: trak.mdia.minf.vmhd,
						smhd: trak.mdia.minf.smhd,
						dinf: trak.mdia.minf.dinf,
						stbl: {
							stsd: stbl.stsd,
							stts: empty(),
							ctts: empty(),
							stsc: empty(),
							stsz: empty(),
							stco: empty(),
							stss: empty()
						}
					}
				}
			}],
			mvex: {
				mehd: {
					fragmentDuration: moov.mvhd.duration
				},
				trexs: [{
					trackId: trak.tkhd.trackId,
					defaultSampleDescriptionIndex: defaultSampleDescriptionIndex,
					defaultSampleDuration: 0,
					defaultSampleSize: 0,
					defaultSampleFlags: 0
				}]
			}
		}

		self._tracks.push({
			trackId: trak.tkhd.trackId,
			timeScale: trak.mdia.mdhd.timeScale,
			samples: samples,
			currSample: null,
			currTime: null,
			moov: trackMoov,
			mime: mime
		})
	}

	if (self._tracks.length === 0) {
		self.emit('error', new Error('no playable tracks'))
		return
	}

	// Must be set last since this is used above
	moov.mvhd.duration = 0

	self._ftyp = {
		type: 'ftyp',
		brand: 'iso5',
		brandVersion: 0,
		compatibleBrands: [
			'iso5'
		]
	}

	var ftypBuf = Box.encode(self._ftyp)
	var data = self._tracks.map(function (track) {
		var moovBuf = Box.encode(track.moov)
		return {
			mime: track.mime,
			init: Buffer.concat([ftypBuf, moovBuf])
		}
	})

	self.emit('ready', data)
}

function empty () {
	return {
		version: 0,
		flags: 0,
		entries: []
	}
}

MP4Remuxer.prototype.seek = function (time) {
	var self = this
	if (!self._tracks) {
		throw new Error('Not ready yet; wait for \'ready\' event')
	}

	if (self._fileStream) {
		self._fileStream.destroy()
		self._fileStream = null
	}

	var startOffset = -1
	self._tracks.map(function (track, i) {
		// find the keyframe before the time
		// stream from there
		if (track.outStream) {
			track.outStream.destroy()
		}
		if (track.inStream) {
			track.inStream.destroy()
			track.inStream = null
		}
		var outStream = track.outStream = mp4.encode()
		var fragment = self._generateFragment(i, time)
		if (!fragment) {
			return outStream.finalize()
		}

		if (startOffset === -1 || fragment.ranges[0].start < startOffset) {
			startOffset = fragment.ranges[0].start
		}

		writeFragment(fragment)

		function writeFragment (frag) {
			if (outStream.destroyed) return
			outStream.box(frag.moof, function (err) {
				if (err) return self.emit('error', err)
				if (outStream.destroyed) return
				var slicedStream = track.inStream.slice(frag.ranges)
				slicedStream.pipe(outStream.mediaData(frag.length, function (err) {
					if (err) return self.emit('error', err)
					if (outStream.destroyed) return
					var nextFrag = self._generateFragment(i)
					if (!nextFrag) {
						return outStream.finalize()
					}
					writeFragment(nextFrag)
				}))
			})
		}
	})

	if (startOffset >= 0) {
		var fileStream = self._fileStream = self._file.createReadStream({
			start: startOffset
		})

		self._tracks.forEach(function (track) {
			track.inStream = new RangeSliceStream(startOffset, {
				// Allow up to a 10MB offset between audio and video,
				// which should be fine for any reasonable interleaving
				// interval and bitrate
				highWaterMark: 10000000
			})
			fileStream.pipe(track.inStream)
		})
	}

	return self._tracks.map(function (track) {
		return track.outStream
	})
}

MP4Remuxer.prototype._findSampleBefore = function (trackInd, time) {
	var self = this

	var track = self._tracks[trackInd]
	var scaledTime = Math.floor(track.timeScale * time)
	var sample = bs(track.samples, scaledTime, function (sample, t) {
		var pts = sample.dts + sample.presentationOffset// - track.editShift
		return pts - t
	})
	if (sample === -1) {
		sample = 0
	} else if (sample < 0) {
		sample = -sample - 2
	}
	// sample is now the last sample with dts <= time
	// Find the preceeding sync sample
	while (!track.samples[sample].sync) {
		sample--
	}
	return sample
}

var MIN_FRAGMENT_DURATION = 1 // second

MP4Remuxer.prototype._generateFragment = function (track, time) {
	var self = this
	/*
	1. Find correct sample
	2. Process backward until sync sample found
	3. Process forward until next sync sample after MIN_FRAGMENT_DURATION found
	*/
	var currTrack = self._tracks[track]
	var firstSample
	if (time !== undefined) {
		firstSample = self._findSampleBefore(track, time)
	} else {
		firstSample = currTrack.currSample
	}

	if (firstSample >= currTrack.samples.length)
		return null

	var startDts = currTrack.samples[firstSample].dts

	var totalLen = 0
	var ranges = []
	for (var currSample = firstSample; currSample < currTrack.samples.length; currSample++) {
		var sample = currTrack.samples[currSample]
		if (sample.sync && sample.dts - startDts >= currTrack.timeScale * MIN_FRAGMENT_DURATION) {
			break // This is a reasonable place to end the fragment
		}

		totalLen += sample.size
		var currRange = ranges.length - 1
		if (currRange < 0 || ranges[currRange].end !== sample.offset) {
			// Push a new range
			ranges.push({
				start: sample.offset,
				end: sample.offset + sample.size
			})
		} else {
			ranges[currRange].end += sample.size
		}
	}

	currTrack.currSample = currSample

	return {
		moof: self._generateMoof(track, firstSample, currSample),
		ranges: ranges,
		length: totalLen
	}
}

MP4Remuxer.prototype._generateMoof = function (track, firstSample, lastSample) {
	var self = this

	var currTrack = self._tracks[track]

	var entries = []
	for (var j = firstSample; j < lastSample; j++) {
		var currSample = currTrack.samples[j]
		entries.push({
			sampleDuration: currSample.duration,
			sampleSize: currSample.size,
			sampleFlags: currSample.sync ? 0x2000000 : 0x1010000,
			sampleCompositionTimeOffset: currSample.presentationOffset
		})
	}

	var moof = {
		type: 'moof',
		mfhd: {
			sequenceNumber: self._fragmentSequence++
		},
		trafs: [{
			tfhd: {
				flags: 0x20000, // default-base-is-moof
				trackId: currTrack.trackId
			},
			tfdt: {
				baseMediaDecodeTime: currTrack.samples[firstSample].dts
			},
			trun: {
				flags: 0xf01,
				dataOffset: 8, // The moof size has to be added to this later as well
				entries: entries
			}
		}]
	}

	// Update the offset
	moof.trafs[0].trun.dataOffset += Box.encodingLength(moof)

	return moof
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 55 */
/***/ (function(module, exports) {

module.exports = function(haystack, needle, comparator, low, high) {
  var mid, cmp;

  if(low === undefined)
    low = 0;

  else {
    low = low|0;
    if(low < 0 || low >= haystack.length)
      throw new RangeError("invalid lower bound");
  }

  if(high === undefined)
    high = haystack.length - 1;

  else {
    high = high|0;
    if(high < low || high >= haystack.length)
      throw new RangeError("invalid upper bound");
  }

  while(low <= high) {
    /* Note that "(low + high) >>> 1" may overflow, and results in a typecast
     * to double (which gives the wrong results). */
    mid = low + (high - low >> 1);
    cmp = +comparator(haystack[mid], needle, mid, haystack);

    /* Too low. */
    if(cmp < 0.0)
      low  = mid + 1;

    /* Too high. */
    else if(cmp > 0.0)
      high = mid - 1;

    /* Key found. */
    else
      return mid;
  }

  /* Key not found. */
  return ~low;
}


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

exports.decode = __webpack_require__(57)
exports.encode = __webpack_require__(62)


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var stream = __webpack_require__(10)
var inherits = __webpack_require__(2)
var nextEvent = __webpack_require__(58)
var Box = __webpack_require__(13)

var EMPTY = new Buffer(0)

module.exports = Decoder

function Decoder () {
  if (!(this instanceof Decoder)) return new Decoder()
  stream.Writable.call(this)

  this.destroyed = false

  this._pending = 0
  this._missing = 0
  this._buf = null
  this._str = null
  this._cb = null
  this._ondrain = null
  this._writeBuffer = null
  this._writeCb = null

  this._ondrain = null
  this._kick()
}

inherits(Decoder, stream.Writable)

Decoder.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  if (err) this.emit('error', err)
  this.emit('close')
}

Decoder.prototype._write = function (data, enc, next) {
  if (this.destroyed) return
  var drained = !this._str || !this._str._writableState.needDrain

  while (data.length && !this.destroyed) {
    if (!this._missing) {
      this._writeBuffer = data
      this._writeCb = next
      return
    }

    var consumed = data.length < this._missing ? data.length : this._missing
    if (this._buf) data.copy(this._buf, this._buf.length - this._missing)
    else if (this._str) drained = this._str.write(consumed === data.length ? data : data.slice(0, consumed))

    this._missing -= consumed

    if (!this._missing) {
      var buf = this._buf
      var cb = this._cb
      var stream = this._str

      this._buf = this._cb = this._str = this._ondrain = null
      drained = true

      if (stream) stream.end()
      if (cb) cb(buf)
    }

    data = consumed === data.length ? EMPTY : data.slice(consumed)
  }

  if (this._pending && !this._missing) {
    this._writeBuffer = data
    this._writeCb = next
    return
  }

  if (drained) next()
  else this._ondrain(next)
}

Decoder.prototype._buffer = function (size, cb) {
  this._missing = size
  this._buf = new Buffer(size)
  this._cb = cb
}

Decoder.prototype._stream = function (size, cb) {
  var self = this
  this._missing = size
  this._str = new MediaData(this)
  this._ondrain = nextEvent(this._str, 'drain')
  this._pending++
  this._str.on('end', function () {
    self._pending--
    self._kick()
  })
  this._cb = cb
  return this._str
}

Decoder.prototype._readBox = function () {
  var self = this
  bufferHeaders(8)

  function bufferHeaders (len, buf) {
    self._buffer(len, function (additionalBuf) {
      if (buf) {
        buf = Buffer.concat([buf, additionalBuf])
      } else {
        buf = additionalBuf
      }
      var headers = Box.readHeaders(buf)
      if (typeof headers === 'number') {
        bufferHeaders(headers - buf.length, buf)
      } else {
        self._pending++
        self._headers = headers
        self.emit('box', headers)
      }
    })
  }
}

Decoder.prototype.stream = function () {
  var self = this
  if (!self._headers) throw new Error('this function can only be called once after \'box\' is emitted')
  var headers = self._headers
  self._headers = null

  return self._stream(headers.contentLen, null)
}

Decoder.prototype.decode = function (cb) {
  var self = this
  if (!self._headers) throw new Error('this function can only be called once after \'box\' is emitted')
  var headers = self._headers
  self._headers = null

  self._buffer(headers.contentLen, function (buf) {
    var box = Box.decodeWithoutHeaders(headers, buf)
    cb(box)
    self._pending--
    self._kick()
  })
}

Decoder.prototype.ignore = function () {
  var self = this
  if (!self._headers) throw new Error('this function can only be called once after \'box\' is emitted')
  var headers = self._headers
  self._headers = null

  this._missing = headers.contentLen
  this._cb = function () {
    self._pending--
    self._kick()
  }
}

Decoder.prototype._kick = function () {
  if (this._pending) return
  if (!this._buf && !this._str) this._readBox()
  if (this._writeBuffer) {
    var next = this._writeCb
    var buffer = this._writeBuffer
    this._writeBuffer = null
    this._writeCb = null
    this._write(buffer, null, next)
  }
}

function MediaData (parent) {
  this._parent = parent
  this.destroyed = false
  stream.PassThrough.call(this)
}

inherits(MediaData, stream.PassThrough)

MediaData.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  this._parent.destroy(err)
  if (err) this.emit('error', err)
  this.emit('close')
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 58 */
/***/ (function(module, exports) {

module.exports = nextEvent

function nextEvent (emitter, name) {
  var next = null
  emitter.on(name, function (data) {
    if (!next) return
    var fn = next
    next = null
    fn(data)
  })

  return function (once) {
    next = once
  }
}


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var UINT_32_MAX = 0xffffffff

exports.encodingLength = function () {
  return 8
}

exports.encode = function (num, buf, offset) {
  if (!buf) buf = new Buffer(8)
  if (!offset) offset = 0

  var top = Math.floor(num / UINT_32_MAX)
  var rem = num - top * UINT_32_MAX

  buf.writeUInt32BE(top, offset)
  buf.writeUInt32BE(rem, offset + 4)
  return buf
}

exports.decode = function (buf, offset) {
  if (!offset) offset = 0

  if (!buf) buf = new Buffer(4)
  if (!offset) offset = 0

  var top = buf.readUInt32BE(offset)
  var rem = buf.readUInt32BE(offset + 4)

  return top * UINT_32_MAX + rem
}

exports.encode.bytes = 8
exports.decode.bytes = 8

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// This is an intentionally recursive require. I don't like it either.
var Box = __webpack_require__(13)
var Descriptor = __webpack_require__(61)

var TIME_OFFSET = 2082844800000

/*
TODO:
test these
add new box versions
*/

// These have 'version' and 'flags' fields in the headers
exports.fullBoxes = {}
var fullBoxes = [
  'mvhd',
  'tkhd',
  'mdhd',
  'vmhd',
  'smhd',
  'stsd',
  'esds',
  'stsz',
  'stco',
  'stss',
  'stts',
  'ctts',
  'stsc',
  'dref',
  'elst',
  'hdlr',
  'mehd',
  'trex',
  'mfhd',
  'tfhd',
  'tfdt',
  'trun'
]
fullBoxes.forEach(function (type) {
  exports.fullBoxes[type] = true
})

exports.ftyp = {}
exports.ftyp.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(exports.ftyp.encodingLength(box))
  var brands = box.compatibleBrands || []
  buf.write(box.brand, 0, 4, 'ascii')
  buf.writeUInt32BE(box.brandVersion, 4)
  for (var i = 0; i < brands.length; i++) buf.write(brands[i], 8 + (i * 4), 4, 'ascii')
  exports.ftyp.encode.bytes = 8 + brands.length * 4
  return buf
}
exports.ftyp.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var brand = buf.toString('ascii', 0, 4)
  var version = buf.readUInt32BE(4)
  var compatibleBrands = []
  for (var i = 8; i < buf.length; i += 4) compatibleBrands.push(buf.toString('ascii', i, i + 4))
  return {
    brand: brand,
    brandVersion: version,
    compatibleBrands: compatibleBrands
  }
}
exports.ftyp.encodingLength = function (box) {
  return 8 + (box.compatibleBrands || []).length * 4
}

exports.mvhd = {}
exports.mvhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(96)
  writeDate(box.ctime || new Date(), buf, 0)
  writeDate(box.mtime || new Date(), buf, 4)
  buf.writeUInt32BE(box.timeScale || 0, 8)
  buf.writeUInt32BE(box.duration || 0, 12)
  writeFixed32(box.preferredRate || 0, buf, 16)
  writeFixed16(box.preferredVolume || 0, buf, 20)
  writeReserved(buf, 22, 32)
  writeMatrix(box.matrix, buf, 32)
  buf.writeUInt32BE(box.previewTime || 0, 68)
  buf.writeUInt32BE(box.previewDuration || 0, 72)
  buf.writeUInt32BE(box.posterTime || 0, 76)
  buf.writeUInt32BE(box.selectionTime || 0, 80)
  buf.writeUInt32BE(box.selectionDuration || 0, 84)
  buf.writeUInt32BE(box.currentTime || 0, 88)
  buf.writeUInt32BE(box.nextTrackId || 0, 92)
  exports.mvhd.encode.bytes = 96
  return buf
}
exports.mvhd.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    ctime: readDate(buf, 0),
    mtime: readDate(buf, 4),
    timeScale: buf.readUInt32BE(8),
    duration: buf.readUInt32BE(12),
    preferredRate: readFixed32(buf, 16),
    preferredVolume: readFixed16(buf, 20),
    matrix: readMatrix(buf.slice(32, 68)),
    previewTime: buf.readUInt32BE(68),
    previewDuration: buf.readUInt32BE(72),
    posterTime: buf.readUInt32BE(76),
    selectionTime: buf.readUInt32BE(80),
    selectionDuration: buf.readUInt32BE(84),
    currentTime: buf.readUInt32BE(88),
    nextTrackId: buf.readUInt32BE(92)
  }
}
exports.mvhd.encodingLength = function (box) {
  return 96
}

exports.tkhd = {}
exports.tkhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(80)
  writeDate(box.ctime || new Date(), buf, 0)
  writeDate(box.mtime || new Date(), buf, 4)
  buf.writeUInt32BE(box.trackId || 0, 8)
  writeReserved(buf, 12, 16)
  buf.writeUInt32BE(box.duration || 0, 16)
  writeReserved(buf, 20, 28)
  buf.writeUInt16BE(box.layer || 0, 28)
  buf.writeUInt16BE(box.alternateGroup || 0, 30)
  buf.writeUInt16BE(box.volume || 0, 32)
  writeMatrix(box.matrix, buf, 36)
  buf.writeUInt32BE(box.trackWidth || 0, 72)
  buf.writeUInt32BE(box.trackHeight || 0, 76)
  exports.tkhd.encode.bytes = 80
  return buf
}
exports.tkhd.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    ctime: readDate(buf, 0),
    mtime: readDate(buf, 4),
    trackId: buf.readUInt32BE(8),
    duration: buf.readUInt32BE(16),
    layer: buf.readUInt16BE(28),
    alternateGroup: buf.readUInt16BE(30),
    volume: buf.readUInt16BE(32),
    matrix: readMatrix(buf.slice(36, 72)),
    trackWidth: buf.readUInt32BE(72),
    trackHeight: buf.readUInt32BE(76)
  }
}
exports.tkhd.encodingLength = function (box) {
  return 80
}

exports.mdhd = {}
exports.mdhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(20)
  writeDate(box.ctime || new Date(), buf, 0)
  writeDate(box.mtime || new Date(), buf, 4)
  buf.writeUInt32BE(box.timeScale || 0, 8)
  buf.writeUInt32BE(box.duration || 0, 12)
  buf.writeUInt16BE(box.language || 0, 16)
  buf.writeUInt16BE(box.quality || 0, 18)
  exports.mdhd.encode.bytes = 20
  return buf
}
exports.mdhd.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    ctime: readDate(buf, 0),
    mtime: readDate(buf, 4),
    timeScale: buf.readUInt32BE(8),
    duration: buf.readUInt32BE(12),
    language: buf.readUInt16BE(16),
    quality: buf.readUInt16BE(18)
  }
}
exports.mdhd.encodingLength = function (box) {
  return 20
}

exports.vmhd = {}
exports.vmhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(8)
  buf.writeUInt16BE(box.graphicsMode || 0, 0)
  var opcolor = box.opcolor || [0, 0, 0]
  buf.writeUInt16BE(opcolor[0], 2)
  buf.writeUInt16BE(opcolor[1], 4)
  buf.writeUInt16BE(opcolor[2], 6)
  exports.vmhd.encode.bytes = 8
  return buf
}
exports.vmhd.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    graphicsMode: buf.readUInt16BE(0),
    opcolor: [buf.readUInt16BE(2), buf.readUInt16BE(4), buf.readUInt16BE(6)]
  }
}
exports.vmhd.encodingLength = function (box) {
  return 8
}

exports.smhd = {}
exports.smhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(4)
  buf.writeUInt16BE(box.balance || 0, 0)
  writeReserved(buf, 2, 4)
  exports.smhd.encode.bytes = 4
  return buf
}
exports.smhd.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    balance: buf.readUInt16BE(0)
  }
}
exports.smhd.encodingLength = function (box) {
  return 4
}

exports.stsd = {}
exports.stsd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(exports.stsd.encodingLength(box))
  var entries = box.entries || []

  buf.writeUInt32BE(entries.length, 0)

  var ptr = 4
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    Box.encode(entry, buf, ptr)
    ptr += Box.encode.bytes
  }

  exports.stsd.encode.bytes = ptr
  return buf
}
exports.stsd.decode = function (buf, offset, end) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)
  var ptr = 4

  for (var i = 0; i < num; i++) {
    var entry = Box.decode(buf, ptr, end)
    entries[i] = entry
    ptr += entry.length
  }

  return {
    entries: entries
  }
}
exports.stsd.encodingLength = function (box) {
  var totalSize = 4
  if (!box.entries) return totalSize
  for (var i = 0; i < box.entries.length; i++) {
    totalSize += Box.encodingLength(box.entries[i])
  }
  return totalSize
}

exports.avc1 = exports.VisualSampleEntry = {}
exports.VisualSampleEntry.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(exports.VisualSampleEntry.encodingLength(box))

  writeReserved(buf, 0, 6)
  buf.writeUInt16BE(box.dataReferenceIndex || 0, 6)
  writeReserved(buf, 8, 24)
  buf.writeUInt16BE(box.width || 0, 24)
  buf.writeUInt16BE(box.height || 0, 26)
  buf.writeUInt32BE(box.hResolution || 0x480000, 28)
  buf.writeUInt32BE(box.vResolution || 0x480000, 32)
  writeReserved(buf, 36, 40)
  buf.writeUInt16BE(box.frameCount || 1, 40)
  var compressorName = box.compressorName || ''
  var nameLen = Math.min(compressorName.length, 31)
  buf.writeUInt8(nameLen, 42)
  buf.write(compressorName, 43, nameLen, 'utf8')
  buf.writeUInt16BE(box.depth || 0x18, 74)
  buf.writeInt16BE(-1, 76)

  var ptr = 78
  var children = box.children || []
  children.forEach(function (child) {
    Box.encode(child, buf, ptr)
    ptr += Box.encode.bytes
  })
  exports.VisualSampleEntry.encode.bytes = ptr
}
exports.VisualSampleEntry.decode = function (buf, offset, end) {
  buf = buf.slice(offset)
  var length = end - offset
  var nameLen = Math.min(buf.readUInt8(42), 31)
  var box = {
    dataReferenceIndex: buf.readUInt16BE(6),
    width: buf.readUInt16BE(24),
    height: buf.readUInt16BE(26),
    hResolution: buf.readUInt32BE(28),
    vResolution: buf.readUInt32BE(32),
    frameCount: buf.readUInt16BE(40),
    compressorName: buf.toString('utf8', 43, 43 + nameLen),
    depth: buf.readUInt16BE(74),
    children: []
  }

  var ptr = 78
  while (length - ptr >= 8) {
    var child = Box.decode(buf, ptr, length)
    box.children.push(child)
    box[child.type] = child
    ptr += child.length
  }

  return box
}
exports.VisualSampleEntry.encodingLength = function (box) {
  var len = 78
  var children = box.children || []
  children.forEach(function (child) {
    len += Box.encodingLength(child)
  })
  return len
}

exports.avcC = {}
exports.avcC.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : Buffer(box.buffer.length)

  box.buffer.copy(buf)
  exports.avcC.encode.bytes = box.buffer.length
}
exports.avcC.decode = function (buf, offset, end) {
  buf = buf.slice(offset, end)

  return {
    mimeCodec: buf.toString('hex', 1, 4),
    buffer: new Buffer(buf)
  }
}
exports.avcC.encodingLength = function (box) {
  return box.buffer.length
}

exports.mp4a = exports.AudioSampleEntry = {}
exports.AudioSampleEntry.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(exports.AudioSampleEntry.encodingLength(box))

  writeReserved(buf, 0, 6)
  buf.writeUInt16BE(box.dataReferenceIndex || 0, 6)
  writeReserved(buf, 8, 16)
  buf.writeUInt16BE(box.channelCount || 2, 16)
  buf.writeUInt16BE(box.sampleSize || 16, 18)
  writeReserved(buf, 20, 24)
  buf.writeUInt32BE(box.sampleRate || 0, 24)

  var ptr = 28
  var children = box.children || []
  children.forEach(function (child) {
    Box.encode(child, buf, ptr)
    ptr += Box.encode.bytes
  })
  exports.AudioSampleEntry.encode.bytes = ptr
}
exports.AudioSampleEntry.decode = function (buf, offset, end) {
  buf = buf.slice(offset, end)
  var length = end - offset
  var box = {
    dataReferenceIndex: buf.readUInt16BE(6),
    channelCount: buf.readUInt16BE(16),
    sampleSize: buf.readUInt16BE(18),
    sampleRate: buf.readUInt32BE(24),
    children: []
  }

  var ptr = 28
  while (length - ptr >= 8) {
    var child = Box.decode(buf, ptr, length)
    box.children.push(child)
    box[child.type] = child
    ptr += child.length
  }

  return box
}
exports.AudioSampleEntry.encodingLength = function (box) {
  var len = 28
  var children = box.children || []
  children.forEach(function (child) {
    len += Box.encodingLength(child)
  })
  return len
}

exports.esds = {}
exports.esds.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : Buffer(box.buffer.length)

  box.buffer.copy(buf, 0)
  exports.esds.encode.bytes = box.buffer.length
}
exports.esds.decode = function (buf, offset, end) {
  buf = buf.slice(offset, end)

  var desc = Descriptor.Descriptor.decode(buf, 0, buf.length)
  var esd = (desc.tagName === 'ESDescriptor') ? desc : {}
  var dcd = esd.DecoderConfigDescriptor || {}
  var oti = dcd.oti || 0
  var dsi = dcd.DecoderSpecificInfo
  var audioConfig = dsi ? (dsi.buffer.readUInt8(0) & 0xf8) >> 3 : 0

  var mimeCodec = null
  if (oti) {
    mimeCodec = oti.toString(16)
    if (audioConfig) {
      mimeCodec += '.' + audioConfig
    }
  }

  return {
    mimeCodec: mimeCodec,
    buffer: new Buffer(buf.slice(0))
  }
}
exports.esds.encodingLength = function (box) {
  return box.buffer.length
}

// TODO: integrate the two versions in a saner way
exports.stsz = {}
exports.stsz.encode = function (box, buf, offset) {
  var entries = box.entries || []
  buf = buf ? buf.slice(offset) : Buffer(exports.stsz.encodingLength(box))

  buf.writeUInt32BE(0, 0)
  buf.writeUInt32BE(entries.length, 4)

  for (var i = 0; i < entries.length; i++) {
    buf.writeUInt32BE(entries[i], i * 4 + 8)
  }

  exports.stsz.encode.bytes = 8 + entries.length * 4
  return buf
}
exports.stsz.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var size = buf.readUInt32BE(0)
  var num = buf.readUInt32BE(4)
  var entries = new Array(num)

  for (var i = 0; i < num; i++) {
    if (size === 0) {
      entries[i] = buf.readUInt32BE(i * 4 + 8)
    } else {
      entries[i] = size
    }
  }

  return {
    entries: entries
  }
}
exports.stsz.encodingLength = function (box) {
  return 8 + box.entries.length * 4
}

exports.stss =
exports.stco = {}
exports.stco.encode = function (box, buf, offset) {
  var entries = box.entries || []
  buf = buf ? buf.slice(offset) : new Buffer(exports.stco.encodingLength(box))

  buf.writeUInt32BE(entries.length, 0)

  for (var i = 0; i < entries.length; i++) {
    buf.writeUInt32BE(entries[i], i * 4 + 4)
  }

  exports.stco.encode.bytes = 4 + entries.length * 4
  return buf
}
exports.stco.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)

  for (var i = 0; i < num; i++) {
    entries[i] = buf.readUInt32BE(i * 4 + 4)
  }

  return {
    entries: entries
  }
}
exports.stco.encodingLength = function (box) {
  return 4 + box.entries.length * 4
}

exports.stts = {}
exports.stts.encode = function (box, buf, offset) {
  var entries = box.entries || []
  buf = buf ? buf.slice(offset) : new Buffer(exports.stts.encodingLength(box))

  buf.writeUInt32BE(entries.length, 0)

  for (var i = 0; i < entries.length; i++) {
    var ptr = i * 8 + 4
    buf.writeUInt32BE(entries[i].count || 0, ptr)
    buf.writeUInt32BE(entries[i].duration || 0, ptr + 4)
  }

  exports.stts.encode.bytes = 4 + box.entries.length * 8
  return buf
}
exports.stts.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)

  for (var i = 0; i < num; i++) {
    var ptr = i * 8 + 4
    entries[i] = {
      count: buf.readUInt32BE(ptr),
      duration: buf.readUInt32BE(ptr + 4)
    }
  }

  return {
    entries: entries
  }
}
exports.stts.encodingLength = function (box) {
  return 4 + box.entries.length * 8
}

exports.ctts = {}
exports.ctts.encode = function (box, buf, offset) {
  var entries = box.entries || []
  buf = buf ? buf.slice(offset) : new Buffer(exports.ctts.encodingLength(box))

  buf.writeUInt32BE(entries.length, 0)

  for (var i = 0; i < entries.length; i++) {
    var ptr = i * 8 + 4
    buf.writeUInt32BE(entries[i].count || 0, ptr)
    buf.writeUInt32BE(entries[i].compositionOffset || 0, ptr + 4)
  }

  exports.ctts.encode.bytes = 4 + entries.length * 8
  return buf
}
exports.ctts.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)

  for (var i = 0; i < num; i++) {
    var ptr = i * 8 + 4
    entries[i] = {
      count: buf.readUInt32BE(ptr),
      compositionOffset: buf.readInt32BE(ptr + 4)
    }
  }

  return {
    entries: entries
  }
}
exports.ctts.encodingLength = function (box) {
  return 4 + box.entries.length * 8
}

exports.stsc = {}
exports.stsc.encode = function (box, buf, offset) {
  var entries = box.entries || []
  buf = buf ? buf.slice(offset) : new Buffer(exports.stsc.encodingLength(box))

  buf.writeUInt32BE(entries.length, 0)

  for (var i = 0; i < entries.length; i++) {
    var ptr = i * 12 + 4
    buf.writeUInt32BE(entries[i].firstChunk || 0, ptr)
    buf.writeUInt32BE(entries[i].samplesPerChunk || 0, ptr + 4)
    buf.writeUInt32BE(entries[i].sampleDescriptionId || 0, ptr + 8)
  }

  exports.stsc.encode.bytes = 4 + entries.length * 12
  return buf
}
exports.stsc.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)

  for (var i = 0; i < num; i++) {
    var ptr = i * 12 + 4
    entries[i] = {
      firstChunk: buf.readUInt32BE(ptr),
      samplesPerChunk: buf.readUInt32BE(ptr + 4),
      sampleDescriptionId: buf.readUInt32BE(ptr + 8)
    }
  }

  return {
    entries: entries
  }
}
exports.stsc.encodingLength = function (box) {
  return 4 + box.entries.length * 12
}

exports.dref = {}
exports.dref.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(exports.dref.encodingLength(box))
  var entries = box.entries || []

  buf.writeUInt32BE(entries.length, 0)

  var ptr = 4
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    var size = (entry.buf ? entry.buf.length : 0) + 4 + 4

    buf.writeUInt32BE(size, ptr)
    ptr += 4

    buf.write(entry.type, ptr, 4, 'ascii')
    ptr += 4

    if (entry.buf) {
      entry.buf.copy(buf, ptr)
      ptr += entry.buf.length
    }
  }

  exports.dref.encode.bytes = ptr
  return buf
}
exports.dref.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)
  var ptr = 4

  for (var i = 0; i < num; i++) {
    var size = buf.readUInt32BE(ptr)
    var type = buf.toString('ascii', ptr + 4, ptr + 8)
    var tmp = buf.slice(ptr + 8, ptr + size)
    ptr += size

    entries[i] = {
      type: type,
      buf: tmp
    }
  }

  return {
    entries: entries
  }
}
exports.dref.encodingLength = function (box) {
  var totalSize = 4
  if (!box.entries) return totalSize
  for (var i = 0; i < box.entries.length; i++) {
    var buf = box.entries[i].buf
    totalSize += (buf ? buf.length : 0) + 4 + 4
  }
  return totalSize
}

exports.elst = {}
exports.elst.encode = function (box, buf, offset) {
  var entries = box.entries || []
  buf = buf ? buf.slice(offset) : new Buffer(exports.elst.encodingLength(box))

  buf.writeUInt32BE(entries.length, 0)

  for (var i = 0; i < entries.length; i++) {
    var ptr = i * 12 + 4
    buf.writeUInt32BE(entries[i].trackDuration || 0, ptr)
    buf.writeUInt32BE(entries[i].mediaTime || 0, ptr + 4)
    writeFixed32(entries[i].mediaRate || 0, buf, ptr + 8)
  }

  exports.elst.encode.bytes = 4 + entries.length * 12
  return buf
}
exports.elst.decode = function (buf, offset) {
  buf = buf.slice(offset)
  var num = buf.readUInt32BE(0)
  var entries = new Array(num)

  for (var i = 0; i < num; i++) {
    var ptr = i * 12 + 4
    entries[i] = {
      trackDuration: buf.readUInt32BE(ptr),
      mediaTime: buf.readInt32BE(ptr + 4),
      mediaRate: readFixed32(buf, ptr + 8)
    }
  }

  return {
    entries: entries
  }
}
exports.elst.encodingLength = function (box) {
  return 4 + box.entries.length * 12
}

exports.hdlr = {}
exports.hdlr.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(exports.hdlr.encodingLength(box))

  var len = 21 + (box.name || '').length
  buf.fill(0, 0, len)

  buf.write(box.handlerType || '', 4, 4, 'ascii')
  writeString(box.name || '', buf, 20)

  exports.hdlr.encode.bytes = len
  return buf
}
exports.hdlr.decode = function (buf, offset, end) {
  buf = buf.slice(offset)
  return {
    handlerType: buf.toString('ascii', 4, 8),
    name: readString(buf, 20, end)
  }
}
exports.hdlr.encodingLength = function (box) {
  return 21 + (box.name || '').length
}

exports.mehd = {}
exports.mehd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(4)

  buf.writeUInt32BE(box.fragmentDuration || 0, 0)
  exports.mehd.encode.bytes = 4
  return buf
}
exports.mehd.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    fragmentDuration: buf.readUInt32BE(0)
  }
}
exports.mehd.encodingLength = function (box) {
  return 4
}

exports.trex = {}
exports.trex.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(20)

  buf.writeUInt32BE(box.trackId || 0, 0)
  buf.writeUInt32BE(box.defaultSampleDescriptionIndex || 0, 4)
  buf.writeUInt32BE(box.defaultSampleDuration || 0, 8)
  buf.writeUInt32BE(box.defaultSampleSize || 0, 12)
  buf.writeUInt32BE(box.defaultSampleFlags || 0, 16)
  exports.trex.encode.bytes = 20
  return buf
}
exports.trex.decode = function (buf, offset) {
  buf = buf.slice(offset)
  return {
    trackId: buf.readUInt32BE(0),
    defaultSampleDescriptionIndex: buf.readUInt32BE(4),
    defaultSampleDuration: buf.readUInt32BE(8),
    defaultSampleSize: buf.readUInt32BE(12),
    defaultSampleFlags: buf.readUInt32BE(16)
  }
}
exports.trex.encodingLength = function (box) {
  return 20
}

exports.mfhd = {}
exports.mfhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(4)

  buf.writeUInt32BE(box.sequenceNumber || 0, 0)
  exports.mfhd.encode.bytes = 4
  return buf
}
exports.mfhd.decode = function (buf, offset) {
  return {
    sequenceNumber: buf.readUint32BE(0)
  }
}
exports.mfhd.encodingLength = function (box) {
  return 4
}

exports.tfhd = {}
exports.tfhd.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(4)
  buf.writeUInt32BE(box.trackId, 0)
  exports.tfhd.encode.bytes = 4
  return buf
}
exports.tfhd.decode = function (buf, offset) {
  // TODO: this
}
exports.tfhd.encodingLength = function (box) {
  // TODO: this is wrong!
  return 4
}

exports.tfdt = {}
exports.tfdt.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(4)

  buf.writeUInt32BE(box.baseMediaDecodeTime || 0, 0)
  exports.tfdt.encode.bytes = 4
  return buf
}
exports.tfdt.decode = function (buf, offset) {
  // TODO: this
}
exports.tfdt.encodingLength = function (box) {
  return 4
}

exports.trun = {}
exports.trun.encode = function (box, buf, offset) {
  buf = buf ? buf.slice(offset) : new Buffer(8 + box.entries.length * 16)

  // TODO: this is wrong
  buf.writeUInt32BE(box.entries.length, 0)
  buf.writeInt32BE(box.dataOffset, 4)
  var ptr = 8
  for (var i = 0; i < box.entries.length; i++) {
    var entry = box.entries[i]
    buf.writeUInt32BE(entry.sampleDuration, ptr)
    ptr += 4

    buf.writeUInt32BE(entry.sampleSize, ptr)
    ptr += 4

    buf.writeUInt32BE(entry.sampleFlags, ptr)
    ptr += 4

    buf.writeUInt32BE(entry.sampleCompositionTimeOffset, ptr)
    ptr += 4
  }
  exports.trun.encode.bytes = ptr
}
exports.trun.decode = function (buf, offset) {
  // TODO: this
}
exports.trun.encodingLength = function (box) {
  // TODO: this is wrong
  return 8 + box.entries.length * 16
}

exports.mdat = {}
exports.mdat.encode = function (box, buf, offset) {
  if (box.buffer) {
    box.buffer.copy(buf, offset)
    exports.mdat.encode.bytes = box.buffer.length
  } else {
    exports.mdat.encode.bytes = exports.mdat.encodingLength(box)
  }
}
exports.mdat.decode = function (buf, start, end) {
  return {
    buffer: new Buffer(buf.slice(start, end))
  }
}
exports.mdat.encodingLength = function (box) {
  return box.buffer ? box.buffer.length : box.contentLength
}

function writeReserved (buf, offset, end) {
  for (var i = offset; i < end; i++) buf[i] = 0
}

function writeDate (date, buf, offset) {
  buf.writeUInt32BE(Math.floor((date.getTime() + TIME_OFFSET) / 1000), offset)
}

// TODO: think something is wrong here
function writeFixed32 (num, buf, offset) {
  buf.writeUInt16BE(Math.floor(num) % (256 * 256), offset)
  buf.writeUInt16BE(Math.floor(num * 256 * 256) % (256 * 256), offset + 2)
}

function writeFixed16 (num, buf, offset) {
  buf[offset] = Math.floor(num) % 256
  buf[offset + 1] = Math.floor(num * 256) % 256
}

function writeMatrix (list, buf, offset) {
  if (!list) list = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (var i = 0; i < list.length; i++) {
    writeFixed32(list[i], buf, offset + i * 4)
  }
}

function writeString (str, buf, offset) {
  var strBuffer = new Buffer(str, 'utf8')
  strBuffer.copy(buf, offset)
  buf[offset + strBuffer.length] = 0
}

function readMatrix (buf) {
  var list = new Array(buf.length / 4)
  for (var i = 0; i < list.length; i++) list[i] = readFixed32(buf, i * 4)
  return list
}

function readDate (buf, offset) {
  return new Date(buf.readUInt32BE(offset) * 1000 - TIME_OFFSET)
}

function readFixed32 (buf, offset) {
  return buf.readUInt16BE(offset) + buf.readUInt16BE(offset + 2) / (256 * 256)
}

function readFixed16 (buf, offset) {
  return buf[offset] + buf[offset + 1] / 256
}

function readString (buf, offset, length) {
  var i
  for (i = 0; i < length; i++) {
    if (buf[offset + i] === 0) {
      break
    }
  }
  return buf.toString('utf8', offset, offset + i)
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var tagToName = {
  0x03: 'ESDescriptor',
  0x04: 'DecoderConfigDescriptor',
  0x05: 'DecoderSpecificInfo',
  0x06: 'SLConfigDescriptor'
}

exports.Descriptor = {}
exports.Descriptor.decode = function (buf, start, end) {
  var tag = buf.readUInt8(start)
  var ptr = start + 1
  var lenByte
  var len = 0
  do {
    lenByte = buf.readUInt8(ptr++)
    len = (len << 7) | (lenByte & 0x7f)
  } while (lenByte & 0x80)

  var obj
  var tagName = tagToName[tag] // May be undefined; that's ok
  if (exports[tagName]) {
    obj = exports[tagName].decode(buf, ptr, end)
  } else {
    obj = {
      buffer: new Buffer(buf.slice(ptr, ptr + len))
    }
  }

  obj.tag = tag
  obj.tagName = tagName
  obj.length = (ptr - start) + len
  obj.contentsLen = len
  return obj
}

exports.DescriptorArray = {}
exports.DescriptorArray.decode = function (buf, start, end) {
  var ptr = start
  var obj = {}
  while (ptr + 2 <= end) {
    var descriptor = exports.Descriptor.decode(buf, ptr, end)
    ptr += descriptor.length
    var tagName = tagToName[descriptor.tag] || ('Descriptor' + descriptor.tag)
    obj[tagName] = descriptor
  }
  return obj
}

exports.ESDescriptor = {}
exports.ESDescriptor.decode = function (buf, start, end) {
  var flags = buf.readUInt8(start + 2)
  var ptr = start + 3
  if (flags & 0x80) {
    ptr += 2
  }
  if (flags & 0x40) {
    var len = buf.readUInt8(ptr)
    ptr += len + 1
  }
  if (flags & 0x20) {
    ptr += 2
  }
  return exports.DescriptorArray.decode(buf, ptr, end)
}

exports.DecoderConfigDescriptor = {}
exports.DecoderConfigDescriptor.decode = function (buf, start, end) {
  var oti = buf.readUInt8(start)
  var obj = exports.DescriptorArray.decode(buf, start + 13, end)
  obj.oti = oti
  return obj
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer, process) {var stream = __webpack_require__(10)
var inherits = __webpack_require__(2)
var Box = __webpack_require__(13)

module.exports = Encoder

function noop () {}

function Encoder () {
  if (!(this instanceof Encoder)) return new Encoder()
  stream.Readable.call(this)

  this.destroyed = false

  this._reading = false
  this._stream = null
  this._drain = null
  this._want = false
  this._onreadable = onreadable
  this._onend = onend

  var self = this

  function onreadable () {
    if (!self._want) return
    self._want = false
    self._read()
  }

  function onend () {
    self._stream = null
  }
}

inherits(Encoder, stream.Readable)

Encoder.prototype.mediaData =
Encoder.prototype.mdat = function (size, cb) {
  var stream = new MediaData(this)
  this.box({type: 'mdat', contentLength: size, encodeBufferLen: 8, stream: stream}, cb)
  return stream
}

Encoder.prototype.box = function (box, cb) {
  if (!cb) cb = noop
  if (this.destroyed) return cb(new Error('Encoder is destroyed'))

  var buf
  if (box.encodeBufferLen) {
    buf = new Buffer(box.encodeBufferLen)
  }
  if (box.stream) {
    box.buffer = null
    buf = Box.encode(box, buf)
    this.push(buf)
    this._stream = box.stream
    this._stream.on('readable', this._onreadable)
    this._stream.on('end', this._onend)
    this._stream.on('end', cb)
    this._forward()
  } else {
    buf = Box.encode(box, buf)
    var drained = this.push(buf)
    if (drained) return process.nextTick(cb)
    this._drain = cb
  }
}

Encoder.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  if (this._stream && this._stream.destroy) this._stream.destroy()
  this._stream = null
  if (this._drain) {
    var cb = this._drain
    this._drain = null
    cb(err)
  }
  if (err) this.emit('error', err)
  this.emit('close')
}

Encoder.prototype.finalize = function () {
  this.push(null)
}

Encoder.prototype._forward = function () {
  if (!this._stream) return

  while (!this.destroyed) {
    var buf = this._stream.read()

    if (!buf) {
      this._want = !!this._stream
      return
    }

    if (!this.push(buf)) return
  }
}

Encoder.prototype._read = function () {
  if (this._reading || this.destroyed) return
  this._reading = true

  if (this._stream) this._forward()
  if (this._drain) {
    var drain = this._drain
    this._drain = null
    drain()
  }

  this._reading = false
}

function MediaData (parent) {
  this._parent = parent
  this.destroyed = false
  stream.PassThrough.call(this)
}

inherits(MediaData, stream.PassThrough)

MediaData.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  this._parent.destroy(err)
  if (err) this.emit('error', err)
  this.emit('close')
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer, __webpack_require__(5)))

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

/*
Instance of writable stream.

call .get(length) or .discard(length) to get a stream (relative to the last end)

emits 'stalled' once everything is written


*/
var inherits = __webpack_require__(2)
var stream = __webpack_require__(10)

module.exports = RangeSliceStream

inherits(RangeSliceStream, stream.Writable)

function RangeSliceStream (offset, opts) {
	var self = this
	if (!(self instanceof RangeSliceStream)) return new RangeSliceStream(offset)
	stream.Writable.call(self, opts)

	self.destroyed = false
	self._queue = []
	self._position = offset || 0
	self._cb = null
	self._buffer = null
	self._out = null
}

RangeSliceStream.prototype._write = function (chunk, encoding, cb) {
	var self = this

	var drained = true

	while (true) {
		if (self.destroyed) {
			return
		}

		// Wait for more queue entries
		if (self._queue.length === 0) {
			self._buffer = chunk
			self._cb = cb
			return
		}

		self._buffer = null
		var currRange = self._queue[0]
		// Relative to the start of chunk, what data do we need?
		var writeStart = Math.max(currRange.start - self._position, 0)
		var writeEnd = currRange.end - self._position

		// Check if we need to throw it all away
		if (writeStart >= chunk.length) {
			self._position += chunk.length
			return cb(null)
		}

		// Check if we need to use it all
		var toWrite
		if (writeEnd > chunk.length) {
			self._position += chunk.length
			if (writeStart === 0) {
				toWrite = chunk
			} else {
				toWrite = chunk.slice(writeStart)
			}
			drained = currRange.stream.write(toWrite) && drained
			break
		}

		self._position += writeEnd
		if (writeStart === 0 && writeEnd === chunk.length) {
			toWrite = chunk
		} else {
			toWrite = chunk.slice(writeStart, writeEnd)
		}
		drained = currRange.stream.write(toWrite) && drained
		if (currRange.last) {
			currRange.stream.end()
		}
		chunk = chunk.slice(writeEnd)
		self._queue.shift()
	}

	if (drained) {
		cb(null)
	} else {
		currRange.stream.once('drain', cb.bind(null, null))
	}
}

RangeSliceStream.prototype.slice = function (ranges) {
	var self = this

	if (self.destroyed) return null

	if (!(ranges instanceof Array)) {
		ranges = [ranges]
	}

	var str = new stream.PassThrough()

	ranges.forEach(function (range, i) {
		self._queue.push({
			start: range.start,
			end: range.end,
			stream: str,
			last: i === (ranges.length - 1)
		})
	})
	if (self._buffer) {
		self._write(self._buffer, null, self._cb)
	}

	return str
}

RangeSliceStream.prototype.destroy = function (err) {
	var self = this
	if (self.destroyed) return
	self.destroyed = true

	if (err) self.emit('error', err)
}


/***/ }),
/* 64 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ArchiveFile__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);



__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!

//const Dweb = require('../js/Dweb');     // Gets SmartDict and the Transports
//TODO-REFACTOR extends SmartDict to eventually allow loading via URL - having problems with webpack ... libsodium -> fs
//TODO-NAMING url could be a name

class ArchiveItem {
    //extends SmartDict {  //TODO should extend SmartDict, but having Webpack issues loading it
    /*
    Base class representing an Item and/or a Search query (A Collection is both).
    This is just storage, the UI is in ArchiveBase and subclasses, theoretically this class could be used for a server or gateway app with no UI.
     Fields:
    itemid: Archive.org reference for object
    item:   Metadata decoded from JSON from metadata search.
    items:  Array of data from a search.
    _list:  Will hold a list of files when its a single item, TODO-REFACTOR maybe this holds a array of ArchiveItem when its a search BUT only have partial metadata info
     Once subclass SmartDict
    _urls:  Will be list of places to retrieve this data (not quite a metadata call)
     */

    constructor({ itemid = undefined, item = undefined } = {}) {
        this.itemid = itemid;
        this.item = item; // Havent fetched yet, subclass constructors may override
    }

    _listLoad() {
        /*
         After set this.item, load the _list with an array for ArchiveFile
        */
        this._list = this.item && this.item.files ? this.item.files.map(f => new __WEBPACK_IMPORTED_MODULE_0__ArchiveFile__["a" /* default */]({ itemid: this.itemid, metadata: f })) // Allow methods on files of item
        : []; // Default to empty, so usage simpler.
    }

    async fetch() {
        /* Fetch what we can about this item, it might be an item or something we have to search for.
            Fetch item metadata as JSON by talking to Metadata API
            Fetch collection info by an advanced search.
            Goes through gateway.dweb.me so that we can work around a CORS issue (general approach & security questions confirmed with Sam!)
             this.itemid Archive Item identifier
            throws: TypeError or Error if fails
            resolves to: this
         */
        if (this.itemid && !this.item) {
            console.log('get metadata for ' + this.itemid);
            //this.item = await Util.fetch_json(`https://archive.org/metadata/${this.itemid}`);
            this.item = await __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].fetch_json(`https://gateway.dweb.me/metadata/archiveid/${this.itemid}`);
            this._listLoad(); // Load _list with ArchiveFile
        }
        if (this.query) {
            // This is for Search, Collection and Home.
            let url =
            //`https://archive.org/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`; // Archive (CORS fail)
            `https://gateway.dweb.me/metadata/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}&and[]=${this.and}`;
            //`http://localhost:4244/metadata/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`; //Testing
            console.log(url);
            let j = await __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].fetch_json(url);
            this.items = j.response.docs;
        }
        return this; // For chaining, but note will need to do an "await fetch"
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ArchiveItem;


/***/ }),
/* 65 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!

//import React from 'react';



class Tile {
  render(item) {
    //xxx shorten/safify certain title usages (compared to Lists.inc)
    const collections = Array.isArray(item.collection) ? item.collection : typeof item.collection === 'string' ? [item.collection] : [];
    const collection = collections[0];
    const nFavorites = collections.filter(e => e.startsWith('fav-')).length;
    const is_collection = item.mediatype === 'collection';
    const classes = 'item-ia' + (is_collection ? ' collection-ia' : '');
    //ARCHIVE-BROWSER on browser, want to load links locally (via APIs) rather than rebuilding HTML page
    // ARCHIVE-BROWSER added key= to keep react happy (I hope)
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'div',
      { className: classes, 'data-id': item.identifier, key: item.identifier },
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'a',
        { className: 'stealth', tabIndex: '-1', onClick: `Nav.nav_details("${collection}");` },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'item-parent' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'item-parent-img' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { src: 'https://archive.org/services/img/' + collection })
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'item-parent-ttl' },
            'xxx parent title'
          )
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'hidden-tiles views C C1' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'nobr',
          { className: 'hidden-xs' },
          __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads)
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'nobr',
          { className: 'hidden-sm hidden-md hidden-lg' },
          __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads)
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'C234' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'item-ttl C C2' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'a',
            { onClick: `Nav.nav_details("${item.identifier}");`, title: item.title },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'div',
              { className: 'tile-img' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { className: 'item-img', xxxstyle: 'height:180px', src: 'https://archive.org/services/img/' + item.identifier })
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'div',
              { className: 'ttl' },
              item.title
            )
          )
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'hidden-tiles pubdate C C3' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'nobr',
            { className: 'hidden-xs' },
            'Dec 3, 2012'
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'nobr',
            { className: 'hidden-sm hidden-md hidden-lg' },
            '12/12'
          )
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'by C C4' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'span',
            { className: 'hidden-lists' },
            item.creator && 'by '
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'span',
            { title: Array.isArray(item.creator) ? item.creator.join(',') : item.creator },
            item.creator
          )
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'mt-icon C C5' },
        __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].mediatype_icon(item.mediatype)
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'h6',
        { className: 'stat ' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-eye', 'aria-hidden': 'true' }),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'span',
          { className: 'sr-only' },
          'eye'
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'nobr',
          null,
          __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads)
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'h6',
        { className: 'stat' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-favorite', 'aria-hidden': 'true' }),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'span',
          { className: 'sr-only' },
          'favorite'
        ),
        nFavorites
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'h6',
        { className: 'stat' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-comment', 'aria-hidden': 'true' }),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'span',
          { className: 'sr-only' },
          'comment'
        ),
        item.num_reviews || "0"
      )
    );
  }

  collection_stats(item) {
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'div',
      { className: 'collection-stats' },
      __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].glyph({ name: 'collection', classes: 'topinblock hidden-lists' }),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'num-items topinblock' },
        '0',
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'micro-label' },
          'ITEMS'
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'num-items hidden-tiles' },
        __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'micro-label' },
          'VIEWS'
        )
      )
    );
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Tile;


/***/ }),
/* 66 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Search__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Details__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__Home__ = __webpack_require__(67);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__Collection__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__Texts__ = __webpack_require__(69);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__Image__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__AV__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__DetailsError__ = __webpack_require__(72);
//import ReactDOM from "react-dom";

__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!

// https://ponyfoo.com/articles/universal-react-babel












class Nav {
  //extends React.Component
  constructor() {
    //super();
    this.mts = ['web', 'texts', 'movies', 'audio', 'software', 'image'];
  }

  navwrapJSX() {
    /* The navigation stuff.   Order is navwrapJSX : maincontent : itemDetailsAbout */
    {/*--TODO-DETAILS update navwrap to match actual code in both search.html and commute.html--*/}
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'div',
      { id: 'navwrap1' },
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { id: 'navwrap2' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'navbar navbar-inverse navbar-static-top', role: 'navigation' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'nav-tophat-helper', className: 'hidden-xs' }),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'ul',
            { className: 'nav navbar-nav' },
            this.mts.map((mt, n) => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'li',
              { key: 'mikey' + n, className: 'dropdown dropdown-ia pull-left' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'a',
                { title: mt, className: 'navia-link ' + mt,
                  onClick: `Nav.nav_details("${mt}")`,
                  'data-top-kind': mt, 'data-toggle': 'tooltip', target: '_top', 'data-placement': 'bottom' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-' + mt, 'aria-hidden': 'true' }),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'span',
                  { className: 'sr-only' },
                  mt
                )
              )
            )),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'li',
              { className: 'navbar-brand-li' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'a',
                { className: 'navbar-brand', onClick: 'Nav.nav_home();', target: '_top' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-logo', 'aria-hidden': 'true' }),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'span',
                  { className: 'sr-only' },
                  'logo'
                )
              )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'li',
              { id: 'nav-search', className: 'dropdown dropdown-ia pull-right' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'a',
                { onClick: '$(this).parents(\'#nav-search\').find(\'form\').submit(); return false;' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-search', 'aria-hidden': 'true' }),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'span',
                  { className: 'sr-only' },
                  'search'
                )
              ),
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                null,
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'form',
                  { role: 'search', onSubmit: 'Nav.nav_search(this.elements[0].value); return 0;', target: '_top' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'label',
                    { htmlFor: 'search-bar-2', className: 'sr-only' },
                    'Search the Archive'
                  ),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('input', { id: 'search-bar-2', placeholder: 'Search', type: 'text', name: 'query', value: '' }),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('input', { type: 'submit', value: 'Search' })
                )
              )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'li',
              { className: 'dropdown dropdown-ia pull-right' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'a',
                { id: 'glyphme', href: 'https://archive.org/donate', _target: 'top',
                  'data-toggle': 'tooltip', 'data-placement': 'bottom', title: 'Donate' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { src: 'https://archive.org/images/gift.png' })
              )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'li',
              { className: 'dropdown dropdown-ia pull-right' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'a',
                { href: 'https://archive.org/create', _target: 'top', 'data-toggle': 'tooltip', 'data-placement': 'bottom', title: 'Upload' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-upload', 'aria-hidden': 'true' }),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'span',
                  { className: 'sr-only' },
                  'upload'
                )
              )
            )
          )
        )
      ),
      ' ',
      ' '
    );
  }

  static clear(destn) {
    // Clear the screen to give confidence that action under way
    // Leaves Nav, clears rest
    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].domrender(new __WEBPACK_IMPORTED_MODULE_9__DetailsError__["a" /* default */](undefined, undefined, __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'span',
      null,
      ' "Loading" '
    )).navwrapped(false), destn);
  }
  static async nav_home() {
    console.log("Navigating to Home");
    return await Nav.nav_details(undefined);
  }

  static async nav_details(id) {
    console.log("Navigating to Details", id);
    let destn = document.getElementById('main'); // Blank window (except Nav) as loading
    Nav.clear(destn);
    await Nav.factory(id, destn, ""); // Not sure what returning ....
    return false; // Dont follow anchor link - unfortunately React ignores this
  }

  static async nav_search(q) {
    console.log("Navigating to Search");
    let destn = document.getElementById('main'); // Blank window (except Nav) as loading
    Nav.clear(destn);
    let s = await new __WEBPACK_IMPORTED_MODULE_2__Search__["default"](typeof q === "object" ? q : typeof q === "string" ? { query: encodeURIComponent(q) } : undefined).fetch();
    s.render(destn, "");
  }

  static async factory(itemid, res, htm) {
    if (!itemid) {
      (await new __WEBPACK_IMPORTED_MODULE_4__Home__["a" /* default */](itemid, undefined).fetch()).render(res, htm);
    } else {
      let obj = await new __WEBPACK_IMPORTED_MODULE_3__Details__["default"](itemid).fetch();
      item = obj.item;
      if (!item.metadata) {
        new __WEBPACK_IMPORTED_MODULE_9__DetailsError__["a" /* default */](itemid, item, `item ${itemid} cannot be found or does not have metadata`).render(res, htm);
      } else {
        if (verbose) console.log("Found mediatype", item.metadata.mediatype);
        switch (item.metadata.mediatype) {
          case "collection":
            return (await new __WEBPACK_IMPORTED_MODULE_5__Collection__["a" /* default */](itemid, item).fetch()).render(res, htm); //fetch will do search
            break;
          case "texts":
            new __WEBPACK_IMPORTED_MODULE_6__Texts__["a" /* default */](itemid, item).render(res, htm);
            break;
          case "image":
            new __WEBPACK_IMPORTED_MODULE_7__Image__["a" /* default */](itemid, item).render(res, htm);
            break;
          case "audio": // Intentionally drop thru to movies
          case "movies":
            new __WEBPACK_IMPORTED_MODULE_8__AV__["a" /* default */](itemid, item).render(res, htm);
            break;
          default:
            new __WEBPACK_IMPORTED_MODULE_9__DetailsError__["a" /* default */](itemid, item, `Unsupported mediatype: ${item.metadata.mediatype}`).render(res, htm);
          //    return new Nav(")
        }
      }
    }
  }

}
/* harmony export (immutable) */ __webpack_exports__["default"] = Nav;


/***/ }),
/* 67 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Search__ = __webpack_require__(14);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!



class Home extends __WEBPACK_IMPORTED_MODULE_1__Search__["default"] {
    constructor(itemid, item) {
        const NOT = ['what_cd', 'cd', 'vinyl', 'librarygenesis', 'bibalex', // per alexis
        'movies', 'audio', 'texts', 'software', 'image', 'data', 'web', // per alexis/tracey
        'additional_collections', 'animationandcartoons', 'artsandmusicvideos', 'audio_bookspoetry', 'audio_foreign', 'audio_music', 'audio_news', 'audio_podcast', 'audio_religion', 'audio_tech', 'computersandtechvideos', 'coverartarchive', 'culturalandacademicfilms', 'ephemera', 'gamevideos', 'inlibrary', 'moviesandfilms', 'newsandpublicaffairs', 'ourmedia', 'radioprograms', 'samples_only', 'spiritualityandreligion', 'stream_only', 'television', 'test_collection', 'usgovfilms', 'vlogs', 'youth_media'];

        const query = 'mediatype:collection AND NOT noindex:true AND NOT collection:web AND NOT identifier:fav-* AND NOT identifier:' + NOT.join(' AND NOT identifier:');
        super({
            query: query,
            sort: '-downloads',
            itemid: itemid,
            item: item
        });
    }
    banner() {
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'center',
            { style: { margin: "35px" } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { style: { fontSize: "125px" }, className: 'iconochive-logo' })
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Home;


/***/ }),
/* 68 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Search__ = __webpack_require__(14);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!



class Collection extends __WEBPACK_IMPORTED_MODULE_1__Search__["default"] {
    constructor(itemid, item) {
        super({
            query: 'collection:' + itemid,
            sort: '-downloads',
            itemid: itemid,
            item: item
        });
    }

    banner() {
        item = this.item;
        //TODO-DETAILS probably move this to the Search class after move to use the approach taken in template_image.js
        const creator = item.metadata.creator && item.metadata.creator != item.metadata.title ? item.metadata.creator : '';
        //ARCHIVE-BROWSER note the elements below were converted to HTML 3 times in original version
        //TODO-DETAILS on prelinger, banner description is getting truncated.
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'welcome container container-ia width-max', style: { 'backgroundColor': 'white' } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { className: 'container' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { className: 'col-xs-11 col-sm-10 welcome-left' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'file-dropper-wrap' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'file-dropper' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { id: 'file-dropper-img', className: 'img-responsive', style: { 'maxWidth': "350px", margin: '0 10px 5px 0' }, src: 'https://archive.org/services/img/' + this.itemid })
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'h1',
                            null,
                            item.metadata.title
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'h4',
                            null,
                            creator
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'descript', style: { maxHeight: "43px", cursor: 'pointer' } },
                            item.metadata.description,
                            ' '
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'col-xs-1 col-sm-2 welcome-right' })
                )
            )
        );
    }
    browserBefore() {
        $('body').addClass('bgEEE');
        // Note the archive_setup.push stuff is subtly different from that for 'search'
        archive_setup.push(function () {
            //TODO-DETAILS check not pushing on top of existing (it probably is)
            AJS.lists_v_tiles_setup('collection');
            $('div.ikind').css({ visibility: 'visible' });
            AJS.popState('');
            AJS.tiler();
            $(window).on('resize  orientationchange', function (evt) {
                clearTimeout(AJS.tiles_wrap_throttler);
                AJS.tiles_wrap_throttler = setTimeout(AJS.tiler, 250);
            });
            // register for scroll updates (for infinite search results)
            $(window).scroll(AJS.scrolled);
        });
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = Collection;


/***/ }),
/* 69 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Details__ = __webpack_require__(6);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!




class Texts extends __WEBPACK_IMPORTED_MODULE_1__Details__["default"] {
    constructor(itemid, item) {
        super(itemid, item);
        this.itemtype = "http://schema.org/TextDigitalDocument";
    }
    archive_setup_push() {
        super.archive_setup_push(); // On eample images the theatre & carosel came before the parts common to AV, Image and Text
        archive_setup.push(function () {
            AJS.booksize();
        });
    }
    theatreIaWrap() {
        let item = this.item;
        let metadata = item.metadata;
        let detailsURL = `https://archive.org/details/${this.itemid}`; // Probably correct as archive.org/details since used as itemProp
        let imageURL = `https://archive.org/services/img/${this.itemid}`;
        //TODO-DETAILS-DWEB use alternative URLS via IPFS
        //TODO-STREAM pass as stream
        let streamURL = `https://archive.org/stream/${this.itemid}`; //{1992.Zandvoorts.Nieuwsblad}`; //TODO-TEXTS Cant find 2nd part of URL
        //let streamURL = `https://archive.org/stream/${this.itemid}/1992.Zandvoorts.Nieuwsblad`;   // In archive.org but needs looking for this string in file names
        //let iframeURL = `${streamURL}?ui=embed#mode/2up`;   //This comes from Traceys code and works
        let iframeURL = `${streamURL}?ui=embed`; //This works and matches archive.org
        let shortEmbedURL = `https://archive.org/stream/${this.itemid}?ui=embed`; //Note on archive.org/details this is different from iframeURL and not clear if that is intentional
        let helpURL = `https://archive.org/help/audio.php?identifier=${this.itemid}`;
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'theatre-ia-wrap', 'class': 'container container-ia width-max' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemprop: 'url', href: detailsURL }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemprop: 'image', href: imageURL }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h1',
                { 'class': 'sr-only' },
                metadata.title
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h2',
                { 'class': 'sr-only' },
                'Item Preview'
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { id: 'theatre-ia', 'class': 'container' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'xs-col-12' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'theatre-controls' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: streamURL },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { title: 'fullscreen view', 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'left',
                                    'class': 'iconochive-fullscreen' })
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: streamURL },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { title: 'search inside', 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'left',
                                    'class': 'iconochive-search' })
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'texty', style: 'font-size:0px', 'class': '' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('iframe', { src: iframeURL,
                                width: '100%', height: '480', frameborder: '0', webkitallowfullscreen: 'true',
                                mozallowfullscreen: 'true', allowfullscreen: true })
                        ),
                        this.cherModal("audio"),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('center', { style: 'color:white;margin-bottom:10px' })
                    )
                )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'flag-overlay', 'class': 'center-area ' })
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Texts;


/***/ }),
/* 70 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Details__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Util__ = __webpack_require__(4);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!





class Image extends __WEBPACK_IMPORTED_MODULE_1__Details__["default"] {
    constructor(itemid, item) {
        /*
        Construct an Image object before rendering it to a HTML page
        item = metadata from a metadata fetch
         */
        super(itemid, item);
        this.itemtype = "http://schema.org/VisualArtwork";
    }
    archive_setup_push() {
        AJS.theatresize();
        AJS.carouselsize('#ia-carousel', true);
        super.archive_setup_push(); // On eample images the theatre & carosel came before the parts common to AV, Image and Text
    }

    theatreIaWrap() {
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        let mainArchiveFile = this._list.find(fi => __WEBPACK_IMPORTED_MODULE_2__Util__["a" /* default */].imageFormats.includes(fi.metadata.format)); // Can be undefined if none included
        let detailsURL = `https://archive.org/details/${itemid}`; //This is probably correct to remain pointed at archive.org since used as an itemprop
        let embedurl = `https://archive.org/embed/${itemid}`;
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'theatre-ia-wrap', className: 'container container-ia width-max  resized', style: { height: "600px" } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemProp: 'url', href: detailsURL }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemProp: 'thumbnailUrl', href: 'https://archive.org/services/img/{itemid}' }),
            item.files.filter(fi => fi.source !== "metadata").map(fi => //TODO-DETAILS-LIST Maybe use _list instead of .files
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemProp: 'associatedMedia', href: `https://archive.org/download/${itemid}/${fi.name}`, key: `${itemid}/${fi.name}` })),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h1',
                { className: 'sr-only' },
                item.metadata.title
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h2',
                { className: 'sr-only' },
                'Item Preview'
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { id: 'theatre-ia', className: 'container' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { className: 'xs-col-12' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'theatre-controls' }),
                        ' ',
                        mainArchiveFile ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { className: 'details-carousel-wrapper' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'section',
                                { id: 'ia-carousel', className: 'carousel slide', 'data-ride': 'carousel', 'data-interval': 'false',
                                    'aria-label': 'Item image slideshow', style: { maxHeight: "600px" } },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'ol',
                                    { className: 'carousel-indicators', style: { display: "none" } },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('li', { 'data-target': '#ia-carousel', 'data-slide-to': '0', className: ' active', role: 'button', tabIndex: '0',
                                        'aria-label': 'Go to image 1' })
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'div',
                                    { className: 'carousel-inner' },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'div',
                                        { className: 'item active' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'a',
                                            { className: 'carousel-image-wrapper',
                                                href: `http://archive.org/download/${itemid}/${mainArchiveFile.metadata.name}`,
                                                title: 'Open full sized image' },
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { id: 'streamContainer', src: mainArchiveFile, className: 'rot0 carousel-image', alt: 'item image #1' })
                                        ),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'div',
                                            { className: 'carousel-caption' },
                                            mainArchiveFile.metadata.name
                                        )
                                    )
                                )
                            )
                        ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { className: 'row', style: { color: "white" } },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { className: 'col-md-10 col-md-offset-1 no-preview' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'p',
                                    { className: 'theatre-title' },
                                    'There Is No Preview Available For This Item'
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'p',
                                    null,
                                    'This item does not appear to have any files that can be experienced on Archive.org',
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        { className: 'hidden-xs hidden-sm' },
                                        'Please download files in this item to interact with them on your computer.'
                                    ),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'a',
                                        { className: 'show-all', href: `https://archive.org/download/${itemid}`, target: '_blank' },
                                        'Show all files'
                                    )
                                )
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'webtorrentStats', style: 'color: white; text-align: center;' }),
                        this.cherModal("audio")
                    )
                )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'flag-overlay', className: 'center-area ' })
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Image;


/***/ }),
/* 71 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Details__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_render_media__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_render_media___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_render_media__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_throttleit__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_throttleit___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_throttleit__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_prettier_bytes__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_prettier_bytes___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_prettier_bytes__);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!








class AV extends __WEBPACK_IMPORTED_MODULE_2__Details__["default"] {
    constructor(itemid, item) {
        super(itemid, item);
        this.itemtype = "http://schema.org/VideoObject";
    }
    setupPlaylist() {
        this.playlist = [];
        //TODO-DETAILS put these formats in a list in Utils.config
        this.avs = this._list.filter(fi => fi.metadata.format == 'h.264' || fi.metadata.format == '512Kb MPEG4');
        if (!this.avs.length) this.avs = this._list.filter(fi => fi.metadata.format == 'VBR MP3');

        if (this.avs.length) {
            this.avs.sort((a, b) => __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].natcompare(a.metadata.name, b.metadata.name)); //Unsure why sorting names, presumably tracks are named alphabetically ?

            this.playlist.push({ name: this.avs[0].name,
                urls: [item.metadata.magnetlink + '/' + this.avs[0].name] });
        }
    }
    archive_setup_push() {
        let self = this;
        super.archive_setup_push(); // On commute.html the Play came after the parts common to AV, Image and Text
        // archive_setup.push(function() { //TODO-ARCHIVE_SETUP move Play from browserAfter to here
        //    Play('jw6', self.playlist, self.cfg);
        // });
    }

    theatreIaWrap() {
        let item = this.item;
        let itemid = this.itemid;
        let detailsurl = `https://archive.org/details/${itemid}`;
        let title = item.title;
        //let cfg  = {"aspectratio": 4/3 }; // Old version in Traceys code which was missign other parts of cfg below
        let cfg = { "start": 0, "embed": null, "so": false, "autoplay": false, "width": 0, "height": 0, "list_height": 0, "audio": false,
            "responsive": true, "flash": false, "hide_list": true,
            "identifier": this.itemid, //TODO-DETAILS-ONLINE check another example and see if identifier should be itemid or title
            "collection": this.item.metadata.collection[0]
        };
        /*
        [{"title":"commute","orig":"commute.avi","image":"/download/commute/commute.thumbs%2Fcommute_000005.jpg",
            "duration":"115.61",
            "sources":[
                {"file":"/download/commute/commute.mp4","type":"mp4","height":"480", "width":"640","label":"480p"},
                {"file":"/download/commute/commute.ogv","type":"ogg","height":"304","width":"400","label":"304p"}],
            "tracks":[{"file":"https://archive.org/stream/commute/commute.thumbs/commute_000005.jpg&vtt=vtt.vtt","kind":"thumbnails"}]}],
        */
        this.setupPlaylist();

        //TODO-DETAILS make next few lines between theatre-ia-wrap and theatre-ia not commute specific
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'theatre-ia-wrap', 'class': 'container container-ia width-max ' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemprop: 'url', href: detailsurl }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h1',
                { 'class': 'sr-only' },
                title
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h2',
                { 'class': 'sr-only' },
                'Movies Preview'
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { id: 'theatre-ia', 'class': 'container' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { 'class': 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { 'class': 'xs-col-12' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'theatre-controls' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: '#', id: 'gofullscreen', onclick: '' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'left', 'class': 'iconochive-fullscreen',
                                    title: 'fullscreen view' })
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: '#', onclick: 'return AJS.flash_click(0)' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'left', 'class': 'iconochive-flash',
                                    title: 'Click to have player try flash first, then HTML5 second' })
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: '#', onclick: 'return AJS.mute_click()' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'left', 'class': 'iconochive-unmute',
                                    title: 'sound is on.  click to mute sound.' })
                            ),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'a',
                                { href: '#', onclick: 'return AJS.mute_click()' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { 'data-toggle': 'tooltip', 'data-container': 'body', 'data-placement': 'left', 'class': 'iconochive-mute',
                                    style: 'display:none', title: 'sound is off.  click for sound.' })
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'noscript',
                            null,
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { 'class': 'alert alert-danger alert-dismissable', 'data-dismiss': 'alert' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'button',
                                    { type: 'button', 'class': 'close', 'data-dismiss': 'alert', 'aria-hidden': 'true' },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', {
                                        'class': 'iconochive-remove-circle', 'aria-hidden': 'true' }),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        { 'class': 'sr-only' },
                                        'remove-circle'
                                    )
                                ),
                                'Internet Archive\'s in-browser video player requires JavaScript to be enabled. It appears your browser does not have it turned on. Please see your browser settings for this feature.'
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'videoContainerX', style: 'text-align: center;' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('video', { id: 'streamContainer', src: this.avs[0] })
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'webtorrentStats', style: 'color: white; text-align: center;' }),
                        this.cherModal("video")
                    ),
                    ' '
                )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'flag-overlay', 'class': 'center-area ' })
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = AV;


/***/ }),
/* 72 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Details__ = __webpack_require__(6);
__webpack_require__(0)({ presets: ['env', 'react'] }); // ES6 JS below!



class DetailsError extends __WEBPACK_IMPORTED_MODULE_1__Details__["default"] {
    constructor(itemid, item, message) {
        super(itemid, item);
        this.message = message;
    }
    theatreIaWrap() {
        return this.message;
    }
    render(res, htm) {
        super.render(res, htm);
    }
    itemDetailsAboutJSX() {}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = DetailsError;


/***/ })
/******/ ]);