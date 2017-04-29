const FunctionBuilder = require('./function-builder');
const GPUUtils = require('../gpu-utils');

///
/// Class: Base
///
/// Represents the 'private/protected' namespace of the GPU class
///
/// *base.js* internal functions namespace
/// *gpu.js* PUBLIC function namespace
///
/// I know @private makes more sense, but since the documentation engine state is undetirmined.
/// (See https://github.com/gpujs/gpu.js/issues/19 regarding documentation engine issue)
/// File isolation is currently the best way to go
///
module.exports = class BaseRunner {
	constructor() {
	  this.kernel = null;
    this.fn = null;
    this.fnString = null;

    this._canvas = GPUUtils.initCanvas();
    this._webgl = GPUUtils.initWebGl(this._canvas);
		this.programCache = {};
		this.endianness = GPUUtils.systemEndianness;

		this.functionBuilder = new FunctionBuilder(this);
		this.functionBuilder.polyfillStandardFunctions();
	}

	// Legacy method to get webgl : Preserved for backwards compatibility
	getGl() {
		return this._webgl;
	}

	textureToArray(texture) {
		const copy = this.createKernel(function(x) {
			return x[this.thread.z][this.thread.y][this.thread.x];
		});

		return copy(texture);
	}

	deleteTexture(texture) {
		this._webgl.deleteTexture(texture.texture);
	}

	///
	/// Get and returns the ASYNCHRONOUS executor, of a class and kernel
	/// This returns a Promise object from an argument set.
	///
	/// Note that there is no current implementation.
	///
  buildPromiseKernel() {
		throw new Error('not yet implemented');
	}

  get mode() {
    throw new Error('"mode" not implemented on BaseRunner');
  }

  ///
  /// Get and returns the Synchronous executor, of a class and kernel
  /// Which returns the result directly after passing the arguments.
  ///
  buildKernel(fn, settings) {
	  settings = settings || {};
    const fnString = fn.toString();
    if(!GPUUtils.isFunctionString(fnString)) {
      throw 'Unable to get body of kernel function';
    }

    settings.runner = this;
    let kernel = new this.Kernel(fnString, settings);
    kernel.build();
    return kernel.bind(kernel);
  }
};
