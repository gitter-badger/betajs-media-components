/*!
betajs-media-components - v0.0.40 - 2016-11-21
Copyright (c) Ziggeo,Oliver Friedmann
Apache-2.0 Software License.
*/
/** @flow **//*!
betajs-scoped - v0.0.12 - 2016-10-02
Copyright (c) Oliver Friedmann
Apache-2.0 Software License.
*/
var Scoped = (function () {
var Globals = (function () {  
/** 
 * This helper module provides functions for reading and writing globally accessible namespaces, both in the browser and in NodeJS.
 * 
 * @module Globals
 * @access private
 */
return { 
		
	/**
	 * Returns the value of a global variable.
	 * 
	 * @param {string} key identifier of a global variable
	 * @return value of global variable or undefined if not existing
	 */
	get : function(key/* : string */) {
		if (typeof window !== "undefined")
			return window[key];
		if (typeof global !== "undefined")
			return global[key];
		if (typeof self !== "undefined")
			return self[key];
		return undefined;
	},

	
	/**
	 * Sets a global variable.
	 * 
	 * @param {string} key identifier of a global variable
	 * @param value value to be set
	 * @return value that has been set
	 */
	set : function(key/* : string */, value) {
		if (typeof window !== "undefined")
			window[key] = value;
		if (typeof global !== "undefined")
			global[key] = value;
		if (typeof self !== "undefined")
			self[key] = value;
		return value;
	},
	
	
	/**
	 * Returns the value of a global variable under a namespaced path.
	 * 
	 * @param {string} path namespaced path identifier of variable
	 * @return value of global variable or undefined if not existing
	 * 
	 * @example
	 * // returns window.foo.bar / global.foo.bar 
	 * Globals.getPath("foo.bar")
	 */
	getPath: function (path/* : string */) {
		var args = path.split(".");
		if (args.length == 1)
			return this.get(path);		
		var current = this.get(args[0]);
		for (var i = 1; i < args.length; ++i) {
			if (!current)
				return current;
			current = current[args[i]];
		}
		return current;
	},


	/**
	 * Sets a global variable under a namespaced path.
	 * 
	 * @param {string} path namespaced path identifier of variable
	 * @param value value to be set
	 * @return value that has been set
	 * 
	 * @example
	 * // sets window.foo.bar / global.foo.bar 
	 * Globals.setPath("foo.bar", 42);
	 */
	setPath: function (path/* : string */, value) {
		var args = path.split(".");
		if (args.length == 1)
			return this.set(path, value);		
		var current = this.get(args[0]) || this.set(args[0], {});
		for (var i = 1; i < args.length - 1; ++i) {
			if (!(args[i] in current))
				current[args[i]] = {};
			current = current[args[i]];
		}
		current[args[args.length - 1]] = value;
		return value;
	}
	
};}).call(this);
/*::
declare module Helper {
	declare function extend<A, B>(a: A, b: B): A & B;
}
*/

var Helper = (function () {  
/** 
 * This helper module provides auxiliary functions for the Scoped system.
 * 
 * @module Helper
 * @access private
 */
return { 
		
	/**
	 * Attached a context to a function.
	 * 
	 * @param {object} obj context for the function
	 * @param {function} func function
	 * 
	 * @return function with attached context
	 */
	method: function (obj, func) {
		return function () {
			return func.apply(obj, arguments);
		};
	},

	
	/**
	 * Extend a base object with all attributes of a second object.
	 * 
	 * @param {object} base base object
	 * @param {object} overwrite second object
	 * 
	 * @return {object} extended base object
	 */
	extend: function (base, overwrite) {
		base = base || {};
		overwrite = overwrite || {};
		for (var key in overwrite)
			base[key] = overwrite[key];
		return base;
	},
	
	
	/**
	 * Returns the type of an object, particulary returning 'array' for arrays.
	 * 
	 * @param obj object in question
	 * 
	 * @return {string} type of object
	 */
	typeOf: function (obj) {
		return Object.prototype.toString.call(obj) === '[object Array]' ? "array" : typeof obj;
	},
	
	
	/**
	 * Returns whether an object is null, undefined, an empty array or an empty object.
	 * 
	 * @param obj object in question
	 * 
	 * @return true if object is empty
	 */
	isEmpty: function (obj) {
		if (obj === null || typeof obj === "undefined")
			return true;
		if (this.typeOf(obj) == "array")
			return obj.length === 0;
		if (typeof obj !== "object")
			return false;
		for (var key in obj)
			return false;
		return true;
	},
	
	
    /**
     * Matches function arguments against some pattern.
     * 
     * @param {array} args function arguments
     * @param {object} pattern typed pattern
     * 
     * @return {object} matched arguments as associative array 
     */	
	matchArgs: function (args, pattern) {
		var i = 0;
		var result = {};
		for (var key in pattern) {
			if (pattern[key] === true || this.typeOf(args[i]) == pattern[key]) {
				result[key] = args[i];
				i++;
			} else if (this.typeOf(args[i]) == "undefined")
				i++;
		}
		return result;
	},
	
	
	/**
	 * Stringifies a value as JSON and functions to string representations.
	 * 
	 * @param value value to be stringified
	 * 
	 * @return stringified value
	 */
	stringify: function (value) {
		if (this.typeOf(value) == "function")
			return "" + value;
		return JSON.stringify(value);
	}	

	
};}).call(this);
var Attach = (function () {  
/** 
 * This module provides functionality to attach the Scoped system to the environment.
 * 
 * @module Attach
 * @access private
 */
return { 
		
	__namespace: "Scoped",
	__revert: null,
	
	
	/**
	 * Upgrades a pre-existing Scoped system to the newest version present. 
	 * 
	 * @param {string} namespace Optional namespace (default is 'Scoped')
	 * @return {object} the attached Scoped system
	 */
	upgrade: function (namespace/* : ?string */) {
		var current = Globals.get(namespace || Attach.__namespace);
		if (current && Helper.typeOf(current) == "object" && current.guid == this.guid && Helper.typeOf(current.version) == "string") {
			var my_version = this.version.split(".");
			var current_version = current.version.split(".");
			var newer = false;
			for (var i = 0; i < Math.min(my_version.length, current_version.length); ++i) {
				newer = parseInt(my_version[i], 10) > parseInt(current_version[i], 10);
				if (my_version[i] != current_version[i]) 
					break;
			}
			return newer ? this.attach(namespace) : current;				
		} else
			return this.attach(namespace);		
	},


	/**
	 * Attaches the Scoped system to the environment. 
	 * 
	 * @param {string} namespace Optional namespace (default is 'Scoped')
	 * @return {object} the attached Scoped system
	 */
	attach : function(namespace/* : ?string */) {
		if (namespace)
			Attach.__namespace = namespace;
		var current = Globals.get(Attach.__namespace);
		if (current == this)
			return this;
		Attach.__revert = current;
		if (current) {
			try {
				var exported = current.__exportScoped();
				this.__exportBackup = this.__exportScoped();
				this.__importScoped(exported);
			} catch (e) {
				// We cannot upgrade the old version.
			}
		}
		Globals.set(Attach.__namespace, this);
		return this;
	},
	

	/**
	 * Detaches the Scoped system from the environment. 
	 * 
	 * @param {boolean} forceDetach Overwrite any attached scoped system by null.
	 * @return {object} the detached Scoped system
	 */
	detach: function (forceDetach/* : ?boolean */) {
		if (forceDetach)
			Globals.set(Attach.__namespace, null);
		if (typeof Attach.__revert != "undefined")
			Globals.set(Attach.__namespace, Attach.__revert);
		delete Attach.__revert;
		if (Attach.__exportBackup)
			this.__importScoped(Attach.__exportBackup);
		return this;
	},
	

	/**
	 * Exports an object as a module if possible. 
	 * 
	 * @param {object} mod a module object (optional, default is 'module')
	 * @param {object} object the object to be exported
	 * @param {boolean} forceExport overwrite potentially pre-existing exports
	 * @return {object} the Scoped system
	 */
	exports: function (mod, object, forceExport) {
		mod = mod || (typeof module != "undefined" ? module : null);
		if (typeof mod == "object" && mod && "exports" in mod && (forceExport || mod.exports == this || !mod.exports || Helper.isEmpty(mod.exports)))
			mod.exports = object || this;
		return this;
	}	

};}).call(this);

function newNamespace (opts/* : {tree ?: boolean, global ?: boolean, root ?: Object} */) {

	var options/* : {
		tree: boolean,
	    global: boolean,
	    root: Object
	} */ = {
		tree: typeof opts.tree === "boolean" ? opts.tree : false,
		global: typeof opts.global === "boolean" ? opts.global : false,
		root: typeof opts.root === "object" ? opts.root : {}
	};

	/*::
	type Node = {
		route: ?string,
		parent: ?Node,
		children: any,
		watchers: any,
		data: any,
		ready: boolean,
		lazy: any
	};
	*/

	function initNode(options)/* : Node */ {
		return {
			route: typeof options.route === "string" ? options.route : null,
			parent: typeof options.parent === "object" ? options.parent : null,
			ready: typeof options.ready === "boolean" ? options.ready : false,
			children: {},
			watchers: [],
			data: {},
			lazy: []
		};
	}
	
	var nsRoot = initNode({ready: true});
	
	if (options.tree) {
		if (options.global) {
			try {
				if (window)
					nsRoot.data = window;
			} catch (e) { }
			try {
				if (global)
					nsRoot.data = global;
			} catch (e) { }
			try {
				if (self)
					nsRoot.data = self;
			} catch (e) { }
		} else
			nsRoot.data = options.root;
	}
	
	function nodeDigest(node/* : Node */) {
		if (node.ready)
			return;
		if (node.parent && !node.parent.ready) {
			nodeDigest(node.parent);
			return;
		}
		if (node.route && node.parent && (node.route in node.parent.data)) {
			node.data = node.parent.data[node.route];
			node.ready = true;
			for (var i = 0; i < node.watchers.length; ++i)
				node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
			node.watchers = [];
			for (var key in node.children)
				nodeDigest(node.children[key]);
		}
	}
	
	function nodeEnforce(node/* : Node */) {
		if (node.ready)
			return;
		if (node.parent && !node.parent.ready)
			nodeEnforce(node.parent);
		node.ready = true;
		if (node.parent) {
			if (options.tree && typeof node.parent.data == "object")
				node.parent.data[node.route] = node.data;
		}
		for (var i = 0; i < node.watchers.length; ++i)
			node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
		node.watchers = [];
	}
	
	function nodeSetData(node/* : Node */, value) {
		if (typeof value == "object" && node.ready) {
			for (var key in value)
				node.data[key] = value[key];
		} else
			node.data = value;
		if (typeof value == "object") {
			for (var ckey in value) {
				if (node.children[ckey])
					node.children[ckey].data = value[ckey];
			}
		}
		nodeEnforce(node);
		for (var k in node.children)
			nodeDigest(node.children[k]);
	}
	
	function nodeClearData(node/* : Node */) {
		if (node.ready && node.data) {
			for (var key in node.data)
				delete node.data[key];
		}
	}
	
	function nodeNavigate(path/* : ?String */) {
		if (!path)
			return nsRoot;
		var routes = path.split(".");
		var current = nsRoot;
		for (var i = 0; i < routes.length; ++i) {
			if (routes[i] in current.children)
				current = current.children[routes[i]];
			else {
				current.children[routes[i]] = initNode({
					parent: current,
					route: routes[i]
				});
				current = current.children[routes[i]];
				nodeDigest(current);
			}
		}
		return current;
	}
	
	function nodeAddWatcher(node/* : Node */, callback, context) {
		if (node.ready)
			callback.call(context || this, node.data);
		else {
			node.watchers.push({
				callback: callback,
				context: context
			});
			if (node.lazy.length > 0) {
				var f = function (node) {
					if (node.lazy.length > 0) {
						var lazy = node.lazy.shift();
						lazy.callback.call(lazy.context || this, node.data);
						f(node);
					}
				};
				f(node);
			}
		}
	}
	
	function nodeUnresolvedWatchers(node/* : Node */, base, result) {
		node = node || nsRoot;
		result = result || [];
		if (!node.ready)
			result.push(base);
		for (var k in node.children) {
			var c = node.children[k];
			var r = (base ? base + "." : "") + c.route;
			result = nodeUnresolvedWatchers(c, r, result);
		}
		return result;
	}

	/** 
	 * The namespace module manages a namespace in the Scoped system.
	 * 
	 * @module Namespace
	 * @access public
	 */
	return {
		
		/**
		 * Extend a node in the namespace by an object.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @param {object} value object that should be used for extend the namespace node
		 */
		extend: function (path, value) {
			nodeSetData(nodeNavigate(path), value);
		},
		
		/**
		 * Set the object value of a node in the namespace.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @param {object} value object that should be used as value for the namespace node
		 */
		set: function (path, value) {
			var node = nodeNavigate(path);
			if (node.data)
				nodeClearData(node);
			nodeSetData(node, value);
		},
		
		/**
		 * Read the object value of a node in the namespace.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @return {object} object value of the node or null if undefined
		 */
		get: function (path) {
			var node = nodeNavigate(path);
			return node.ready ? node.data : null;
		},
		
		/**
		 * Lazily navigate to a node in the namespace.
		 * Will asynchronously call the callback as soon as the node is being touched.
		 *
		 * @param {string} path path to the node in the namespace
		 * @param {function} callback callback function accepting the node's object value
		 * @param {context} context optional callback context
		 */
		lazy: function (path, callback, context) {
			var node = nodeNavigate(path);
			if (node.ready)
				callback(context || this, node.data);
			else {
				node.lazy.push({
					callback: callback,
					context: context
				});
			}
		},
		
		/**
		 * Digest a node path, checking whether it has been defined by an external system.
		 * 
		 * @param {string} path path to the node in the namespace
		 */
		digest: function (path) {
			nodeDigest(nodeNavigate(path));
		},
		
		/**
		 * Asynchronously access a node in the namespace.
		 * Will asynchronously call the callback as soon as the node is being defined.
		 *
		 * @param {string} path path to the node in the namespace
		 * @param {function} callback callback function accepting the node's object value
		 * @param {context} context optional callback context
		 */
		obtain: function (path, callback, context) {
			nodeAddWatcher(nodeNavigate(path), callback, context);
		},
		
		/**
		 * Returns all unresolved watchers under a certain path.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @return {array} list of all unresolved watchers 
		 */
		unresolvedWatchers: function (path) {
			return nodeUnresolvedWatchers(nodeNavigate(path), path);
		},
		
		__export: function () {
			return {
				options: options,
				nsRoot: nsRoot
			};
		},
		
		__import: function (data) {
			options = data.options;
			nsRoot = data.nsRoot;
		}
		
	};
	
}
function newScope (parent, parentNS, rootNS, globalNS) {
	
	var self = this;
	var nextScope = null;
	var childScopes = [];
	var parentNamespace = parentNS;
	var rootNamespace = rootNS;
	var globalNamespace = globalNS;
	var localNamespace = newNamespace({tree: true});
	var privateNamespace = newNamespace({tree: false});
	
	var bindings = {
		"global": {
			namespace: globalNamespace
		}, "root": {
			namespace: rootNamespace
		}, "local": {
			namespace: localNamespace
		}, "default": {
			namespace: privateNamespace
		}, "parent": {
			namespace: parentNamespace
		}, "scope": {
			namespace: localNamespace,
			readonly: false
		}
	};
	
	var custom = function (argmts, name, callback) {
		var args = Helper.matchArgs(argmts, {
			options: "object",
			namespaceLocator: true,
			dependencies: "array",
			hiddenDependencies: "array",
			callback: true,
			context: "object"
		});
		
		var options = Helper.extend({
			lazy: this.options.lazy
		}, args.options || {});
		
		var ns = this.resolve(args.namespaceLocator);
		
		var execute = function () {
			this.require(args.dependencies, args.hiddenDependencies, function () {
				arguments[arguments.length - 1].ns = ns;
				if (this.options.compile) {
					var params = [];
					for (var i = 0; i < argmts.length; ++i)
						params.push(Helper.stringify(argmts[i]));
					this.compiled += this.options.ident + "." + name + "(" + params.join(", ") + ");\n\n";
				}
				if (this.options.dependencies) {
					this.dependencies[ns.path] = this.dependencies[ns.path] || {};
					if (args.dependencies) {
						args.dependencies.forEach(function (dep) {
							this.dependencies[ns.path][this.resolve(dep).path] = true;
						}, this);
					}
					if (args.hiddenDependencies) {
						args.hiddenDependencies.forEach(function (dep) {
							this.dependencies[ns.path][this.resolve(dep).path] = true;
						}, this);
					}
				}
				var result = this.options.compile ? {} : args.callback.apply(args.context || this, arguments);
				callback.call(this, ns, result);
			}, this);
		};
		
		if (options.lazy)
			ns.namespace.lazy(ns.path, execute, this);
		else
			execute.apply(this);

		return this;
	};
	
	/** 
	 * This module provides all functionality in a scope.
	 * 
	 * @module Scoped
	 * @access public
	 */
	return {
		
		getGlobal: Helper.method(Globals, Globals.getPath),
		setGlobal: Helper.method(Globals, Globals.setPath),
		
		options: {
			lazy: false,
			ident: "Scoped",
			compile: false,
			dependencies: false
		},
		
		compiled: "",
		
		dependencies: {},
		
		
		/**
		 * Returns a reference to the next scope that will be obtained by a subScope call.
		 * 
		 * @return {object} next scope
		 */
		nextScope: function () {
			if (!nextScope)
				nextScope = newScope(this, localNamespace, rootNamespace, globalNamespace);
			return nextScope;
		},
		
		/**
		 * Creates a sub scope of the current scope and returns it.
		 * 
		 * @return {object} sub scope
		 */
		subScope: function () {
			var sub = this.nextScope();
			childScopes.push(sub);
			nextScope = null;
			return sub;
		},
		
		/**
		 * Creates a binding within in the scope. 
		 * 
		 * @param {string} alias identifier of the new binding
		 * @param {string} namespaceLocator identifier of an existing namespace path
		 * @param {object} options options for the binding
		 * 
		 */
		binding: function (alias, namespaceLocator, options) {
			if (!bindings[alias] || !bindings[alias].readonly) {
				var ns;
				if (Helper.typeOf(namespaceLocator) != "string") {
					ns = {
						namespace: newNamespace({
							tree: true,
							root: namespaceLocator
						}),
						path: null	
					};
				} else
					ns = this.resolve(namespaceLocator);
				bindings[alias] = Helper.extend(options, ns);
			}
			return this;
		},
		
		
		/**
		 * Resolves a name space locator to a name space.
		 * 
		 * @param {string} namespaceLocator name space locator
		 * @return {object} resolved name space
		 * 
		 */
		resolve: function (namespaceLocator) {
			var parts = namespaceLocator.split(":");
			if (parts.length == 1) {
				return {
					namespace: privateNamespace,
					path: parts[0]
				};
			} else {
				var binding = bindings[parts[0]];
				if (!binding)
					throw ("The namespace '" + parts[0] + "' has not been defined (yet).");
				return {
					namespace: binding.namespace,
					path : binding.path && parts[1] ? binding.path + "." + parts[1] : (binding.path || parts[1])
				};
			}
		},

		
		/**
		 * Defines a new name space once a list of name space locators is available.
		 * 
		 * @param {string} namespaceLocator the name space that is to be defined
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments and returning the new definition
		 * @param {object} context a callback context (optional)
		 * 
		 */
		define: function () {
			return custom.call(this, arguments, "define", function (ns, result) {
				if (ns.namespace.get(ns.path))
					throw ("Scoped namespace " + ns.path + " has already been defined. Use extend to extend an existing namespace instead");
				ns.namespace.set(ns.path, result);
			});
		},
		
		
		/**
		 * Assume a specific version of a module and fail if it is not met.
		 * 
		 * @param {string} assumption name space locator
		 * @param {string} version assumed version
		 * 
		 */
		assumeVersion: function () {
			var args = Helper.matchArgs(arguments, {
				assumption: true,
				dependencies: "array",
				callback: true,
				context: "object",
				error: "string"
			});
			var dependencies = args.dependencies || [];
			dependencies.unshift(args.assumption);
			this.require(dependencies, function () {
				var argv = arguments;
				var assumptionValue = argv[0];
				argv[0] = assumptionValue.split(".");
				for (var i = 0; i < argv[0].length; ++i)
					argv[0][i] = parseInt(argv[0][i], 10);
				if (Helper.typeOf(args.callback) === "function") {
					if (!args.callback.apply(args.context || this, args))
						throw ("Scoped Assumption '" + args.assumption + "' failed, value is " + assumptionValue + (args.error ? ", but assuming " + args.error : ""));
				} else {
					var version = (args.callback + "").split(".");
					for (var j = 0; j < Math.min(argv[0].length, version.length); ++j)
						if (parseInt(version[j], 10) > argv[0][j])
							throw ("Scoped Version Assumption '" + args.assumption + "' failed, value is " + assumptionValue + ", but assuming at least " + args.callback);
				}
			});
		},
		
		
		/**
		 * Extends a potentiall existing name space once a list of name space locators is available.
		 * 
		 * @param {string} namespaceLocator the name space that is to be defined
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments and returning the new additional definitions.
		 * @param {object} context a callback context (optional)
		 * 
		 */
		extend: function () {
			return custom.call(this, arguments, "extend", function (ns, result) {
				ns.namespace.extend(ns.path, result);
			});
		},
				
		
		/**
		 * Requires a list of name space locators and calls a function once they are present.
		 * 
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments
		 * @param {object} context a callback context (optional)
		 * 
		 */
		require: function () {
			var args = Helper.matchArgs(arguments, {
				dependencies: "array",
				hiddenDependencies: "array",
				callback: "function",
				context: "object"
			});
			args.callback = args.callback || function () {};
			var dependencies = args.dependencies || [];
			var allDependencies = dependencies.concat(args.hiddenDependencies || []);
			var count = allDependencies.length;
			var deps = [];
			var environment = {};
			if (count) {
				var f = function (value) {
					if (this.i < deps.length)
						deps[this.i] = value;
					count--;
					if (count === 0) {
						deps.push(environment);
						args.callback.apply(args.context || this.ctx, deps);
					}
				};
				for (var i = 0; i < allDependencies.length; ++i) {
					var ns = this.resolve(allDependencies[i]);
					if (i < dependencies.length)
						deps.push(null);
					ns.namespace.obtain(ns.path, f, {
						ctx: this,
						i: i
					});
				}
			} else {
				deps.push(environment);
				args.callback.apply(args.context || this, deps);
			}
			return this;
		},

		
		/**
		 * Digest a name space locator, checking whether it has been defined by an external system.
		 * 
		 * @param {string} namespaceLocator name space locator
		 */
		digest: function (namespaceLocator) {
			var ns = this.resolve(namespaceLocator);
			ns.namespace.digest(ns.path);
			return this;
		},
		
		
		/**
		 * Returns all unresolved definitions under a namespace locator
		 * 
		 * @param {string} namespaceLocator name space locator, e.g. "global:"
		 * @return {array} list of all unresolved definitions 
		 */
		unresolved: function (namespaceLocator) {
			var ns = this.resolve(namespaceLocator);
			return ns.namespace.unresolvedWatchers(ns.path);
		},
		
		/**
		 * Exports the scope.
		 * 
		 * @return {object} exported scope
		 */
		__export: function () {
			return {
				parentNamespace: parentNamespace.__export(),
				rootNamespace: rootNamespace.__export(),
				globalNamespace: globalNamespace.__export(),
				localNamespace: localNamespace.__export(),
				privateNamespace: privateNamespace.__export()
			};
		},
		
		/**
		 * Imports a scope from an exported scope.
		 * 
		 * @param {object} data exported scope to be imported
		 * 
		 */
		__import: function (data) {
			parentNamespace.__import(data.parentNamespace);
			rootNamespace.__import(data.rootNamespace);
			globalNamespace.__import(data.globalNamespace);
			localNamespace.__import(data.localNamespace);
			privateNamespace.__import(data.privateNamespace);
		}
		
	};
	
}
var globalNamespace = newNamespace({tree: true, global: true});
var rootNamespace = newNamespace({tree: true});
var rootScope = newScope(null, rootNamespace, rootNamespace, globalNamespace);

var Public = Helper.extend(rootScope, (function () {  
/** 
 * This module includes all public functions of the Scoped system.
 * 
 * It includes all methods of the root scope and the Attach module.
 * 
 * @module Public
 * @access public
 */
return {
		
	guid: "4b6878ee-cb6a-46b3-94ac-27d91f58d666",
	version: '49.1475462345450',
		
	upgrade: Attach.upgrade,
	attach: Attach.attach,
	detach: Attach.detach,
	exports: Attach.exports,
	
	/**
	 * Exports all data contained in the Scoped system.
	 * 
	 * @return data of the Scoped system.
	 * @access private
	 */
	__exportScoped: function () {
		return {
			globalNamespace: globalNamespace.__export(),
			rootNamespace: rootNamespace.__export(),
			rootScope: rootScope.__export()
		};
	},
	
	/**
	 * Import data into the Scoped system.
	 * 
	 * @param data of the Scoped system.
	 * @access private
	 */
	__importScoped: function (data) {
		globalNamespace.__import(data.globalNamespace);
		rootNamespace.__import(data.rootNamespace);
		rootScope.__import(data.rootScope);
	}
	
};

}).call(this));

Public = Public.upgrade();
Public.exports();
	return Public;
}).call(this);
/*!
betajs-media-components - v0.0.40 - 2016-11-21
Copyright (c) Ziggeo,Oliver Friedmann
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS.MediaComponents');
Scoped.binding('base', 'global:BetaJS');
Scoped.binding('browser', 'global:BetaJS.Browser');
Scoped.binding('flash', 'global:BetaJS.Flash');
Scoped.binding('media', 'global:BetaJS.Media');
Scoped.binding('dynamics', 'global:BetaJS.Dynamics');
Scoped.binding('jquery', 'global:jQuery');
Scoped.define("module:", function () {
	return {
    "guid": "7a20804e-be62-4982-91c6-98eb096d2e70",
    "version": "57.1479739827567"
};
});
Scoped.assumeVersion('base:version', 502);
Scoped.assumeVersion('browser:version', 78);
Scoped.assumeVersion('flash:version', 33);
Scoped.assumeVersion('dynamics:version', 251);
Scoped.assumeVersion('media:version', 57);
Scoped.extend('module:Templates', function () {
return {"video_player_controlbar":" <div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideonactivity ? (css + '-dashboard-hidden') : ''}}\">  <div class=\"{{css}}-progressbar {{activitydelta < 2500 || ismobile ? '' : (css + '-progressbar-small')}}\"       onmousedown=\"{{startUpdatePosition(domEvent)}}\"       onmouseup=\"{{stopUpdatePosition(domEvent)}}\"       onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"       onmousemove=\"{{progressUpdatePosition(domEvent)}}\">   <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>   <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\">    <div class=\"{{css}}-progressbar-button\"></div>   </div>  </div>  <div class=\"{{css}}-backbar\"></div>  <div class=\"{{css}}-controlbar\">         <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">             <div class=\"{{css}}-button-inner\">                 {{string('submit-video')}}             </div>         </div>         <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{rerecordable}}\"  ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-ccw\"></i>             </div>         </div>   <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">    <div class=\"{{css}}-button-inner\">     <i class=\"{{css}}-icon-play\"></i>    </div>   </div>   <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-pause\"></i>             </div>   </div>   <div class=\"{{css}}-time-container\">    <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}</div>    <div class=\"{{css}}-time-sep\">/</div>    <div class=\"{{css}}-time-value\" title=\"{{string('total-time')}}\">{{duration_formatted}}</div>   </div>   <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{fullscreen}}\" ba-click=\"toggle_fullscreen()\" title=\"{{string('fullscreen-video')}}\">    <div class=\"{{css}}-button-inner\">     <i class=\"{{css}}-icon-resize-full\"></i>    </div>   </div>   <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">    <div class=\"{{css}}-button-inner\">     <span class=\"{{css}}-button-text\">{{currentstream_label}}</span>    </div>   </div>   <div class=\"{{css}}-volumebar\">    <div class=\"{{css}}-volumebar-inner\"         onmousedown=\"{{startUpdateVolume(domEvent)}}\"                  onmouseup=\"{{stopUpdateVolume(domEvent)}}\"                  onmouseleave=\"{{stopUpdateVolume(domEvent)}}\"                  onmousemove=\"{{progressUpdateVolume(domEvent)}}\">     <div class=\"{{css}}-volumebar-position\" ba-styles=\"{{{width: Math.min(100, Math.round(volume * 100)) + '%'}}}\">         <div class=\"{{css}}-volumebar-button\" title=\"{{string('volume-button')}}\"></div>     </div>    </div>   </div>   <div class=\"{{css}}-rightbutton-container\" ba-click=\"toggle_volume()\" title=\"{{string(volume > 0 ? 'volume-mute' : 'volume-unmute')}}\">    <div class=\"{{css}}-button-inner\">     <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>    </div>   </div>  </div> </div> ","video_player_loader":" <div class=\"{{css}}-loader-container\">     <div class=\"{{css}}-loader-loader\" title=\"{{string('tooltip')}}\">     </div> </div>","video_player_message":" <div class=\"{{css}}-message-container\" ba-click=\"click()\">     <div class='{{css}}-message-message'>         {{message}}     </div> </div>","playbutton":" <div class=\"{{css}}-playbutton-container\" ba-click=\"play()\" title=\"{{string('tooltip')}}\">  <div class=\"{{css}}-playbutton-button\"></div> </div>  <div class=\"{{css}}-rerecord-bar\" ba-if=\"{{rerecordable || submittable}}\">  <div class=\"{{css}}-rerecord-backbar\"></div>  <div class=\"{{css}}-rerecord-frontbar\">         <div class=\"{{css}}-rerecord-button-container\" ba-if=\"{{submittable}}\">             <div class=\"{{css}}-rerecord-button\" onclick=\"{{submit()}}\">                 {{string('submit-video')}}             </div>         </div>         <div class=\"{{css}}-rerecord-button-container\" ba-if=\"{{rerecordable}}\">          <div class=\"{{css}}-rerecord-button\" onclick=\"{{rerecord()}}\">           {{string('rerecord')}}          </div>         </div>  </div> </div> ","player":" <div     class=\"{{css}}-container {{css}}-size-{{csssize}} {{iecss}}-{{ie8 ? 'ie8' : 'noie8'}} {{csstheme}}\"     ba-on:mousemove=\"user_activity()\"     ba-on:mousedown=\"user_activity()\"     ba-on:touchstart=\"user_activity()\"     style=\"{{width ? 'width:' + width + ((width + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}{{height ? 'height:' + height + ((height + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}\" >     <video class=\"{{css}}-video\" data-video=\"video\"></video>     <div class=\"{{css}}-overlay\" data-video=\"ad\" style=\"display:none\"></div>     <div class='{{css}}-overlay'>      <ba-{{dyncontrolbar}}       ba-css=\"{{csscontrolbar || css}}\"       ba-template=\"{{tmplcontrolbar}}\"       ba-show=\"{{controlbar_active}}\"       ba-playing=\"{{playing}}\"       ba-event:rerecord=\"rerecord\"       ba-event:submit=\"submit\"       ba-event:play=\"play\"       ba-event:pause=\"pause\"       ba-event:position=\"seek\"       ba-event:volume=\"set_volume\"       ba-event:fullscreen=\"toggle_fullscreen\"       ba-volume=\"{{volume}}\"       ba-duration=\"{{duration}}\"       ba-cached=\"{{buffered}}\"       ba-position=\"{{position}}\"       ba-activitydelta=\"{{activity_delta}}\"       ba-hideoninactivity=\"{{hideoninactivity}}\"       ba-rerecordable=\"{{rerecordable}}\"       ba-submittable=\"{{submittable}}\"       ba-streams=\"{{streams}}\"       ba-currentstream=\"{{=currentstream}}\"       ba-fullscreen=\"{{fullscreensupport && !nofullscreen}}\"       ba-source=\"{{source}}\"   ></ba-{{dyncontrolbar}}>      <ba-{{dynplaybutton}}       ba-css=\"{{cssplaybutton || css}}\"       ba-template=\"{{tmplplaybutton}}\"       ba-show=\"{{playbutton_active}}\"       ba-rerecordable=\"{{rerecordable}}\"       ba-submittable=\"{{submittable}}\"       ba-event:play=\"playbutton_click\"       ba-event:rerecord=\"rerecord\"       ba-event:submit=\"submit\"   ></ba-{{dynplaybutton}}>      <ba-{{dynloader}}       ba-css=\"{{cssloader || css}}\"       ba-template=\"{{tmplloader}}\"       ba-show=\"{{loader_active}}\"   ></ba-{{dynloader}}>      <ba-{{dynmessage}}       ba-css=\"{{cssmessage || css}}\"       ba-template=\"{{tmplmessage}}\"       ba-show=\"{{message_active}}\"       ba-message=\"{{message}}\"       ba-event:click=\"message_click\"   ></ba-{{dynmessage}}>    <ba-{{dyntopmessage}}       ba-css=\"{{csstopmessage || css}}\"       ba-template=\"{{tmpltopmessage}}\"       ba-show=\"{{topmessage}}\"       ba-topmessage=\"{{topmessage}}\"   ></ba-{{dyntopmessage}}>     </div> </div> ","video_player_topmessage":" <div class=\"{{css}}-topmessage-container\">     <div class='{{css}}-topmessage-background'>     </div>     <div class='{{css}}-topmessage-message'>         {{topmessage}}     </div> </div> ","video_recorder_chooser":" <div class=\"{{css}}-chooser-container\">   <div class=\"{{css}}-chooser-button-container\">   <div>    <div class=\"{{css}}-chooser-primary-button\"         ba-click=\"primary()\"         ba-if=\"{{has_primary}}\">     <input ba-if=\"{{enable_primary_select && primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\"            capture />     <input ba-if=\"{{enable_primary_select && !primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\" />     <i class=\"{{css}}-icon-{{primaryrecord ? 'videocam' : 'upload'}}\"></i>     <span>      {{primary_label}}     </span>    </div>   </div>   <div>    <div class=\"{{css}}-chooser-secondary-button\"         ba-click=\"secondary()\"         ba-if=\"{{has_secondary}}\">     <input ba-if=\"{{enable_secondary_select && secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <input ba-if=\"{{enable_secondary_select && !secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <span>      {{secondary_label}}     </span>    </div>   </div>  </div> </div>","video_recorder_controlbar":"<div class=\"{{css}}-dashboard\">  <div class=\"{{css}}-backbar\"></div>  <div class=\"{{css}}-settings\" ba-show=\"{{settingsvisible && settingsopen}}\">   <div class=\"{{css}}-settings-backbar\"></div>   <div class=\"{{css}}-settings-front\">    <ul ba-repeat=\"{{camera :: cameras}}\">     <li>      <input type='radio' name='camera' value=\"{{selectedcamera == camera.id}}\" onclick=\"{{selectCamera(camera.id)}}\" />      <span></span>      <label onclick=\"{{selectCamera(camera.id)}}\">       {{camera.label}}      </label>      </li>    </ul>    <hr ba-show=\"{{!noaudio}}\"/>    <ul ba-repeat=\"{{microphone :: microphones}}\" ba-show=\"{{!noaudio}}\">     <li onclick=\"{{selectMicrophone(microphone.id)}}\">      <input type='radio' name='microphone' value=\"{{selectedmicrophone == microphone.id}}\" />      <span></span>      <label>       {{microphone.label}}      </label>      </li>    </ul>   </div>  </div>  <div class=\"{{css}}-controlbar\">         <div class=\"{{css}}-leftbutton-container\" ba-show=\"{{settingsvisible}}\">             <div class=\"{{css}}-button-inner {{css}}-button-{{settingsopen ? 'selected' : 'unselected'}}\"                  onclick=\"{{settingsopen=!settingsopen}}\"                  onmouseenter=\"{{hover(string('settings'))}}\"                  onmouseleave=\"{{unhover()}}\">                 <i class=\"{{css}}-icon-cog\"></i>             </div>         </div>         <div class=\"{{css}}-lefticon-container\" ba-show=\"{{settingsvisible}}\">             <div class=\"{{css}}-icon-inner\"                  onmouseenter=\"{{hover(string(camerahealthy ? 'camerahealthy' : 'cameraunhealthy'))}}\"                  onmouseleave=\"{{unhover()}}\">                 <i class=\"{{css}}-icon-videocam {{css}}-icon-state-{{camerahealthy ? 'good' : 'bad' }}\"></i>             </div>         </div>         <div class=\"{{css}}-lefticon-container\" ba-show=\"{{settingsvisible && !noaudio}}\">             <div class=\"{{css}}-icon-inner\"                  onmouseenter=\"{{hover(string(microphonehealthy ? 'microphonehealthy' : 'microphoneunhealthy'))}}\"                  onmouseleave=\"{{unhover()}}\">                 <i class=\"{{css}}-icon-mic {{css}}-icon-state-{{microphonehealthy ? 'good' : 'bad' }}\"></i>             </div>         </div>         <div class=\"{{css}}-lefticon-container\" ba-show=\"{{stopvisible && recordingindication}}\">             <div class=\"{{css}}-recording-indication\">             </div>         </div>         <div class=\"{{css}}-label-container\" ba-show=\"{{controlbarlabel}}\">          <div class=\"{{css}}-label-label\">           {{controlbarlabel}}          </div>         </div>         <div class=\"{{css}}-rightbutton-container\" ba-show=\"{{recordvisible}}\">          <div class=\"{{css}}-button-primary\"                  onclick=\"{{record()}}\"                  onmouseenter=\"{{hover(string('record-tooltip'))}}\"                  onmouseleave=\"{{unhover()}}\">           {{string('record')}}          </div>         </div>         <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{uploadcovershotvisible}}\">          <div class=\"{{css}}-button-primary\"                  onmouseenter=\"{{hover(string('upload-covershot-tooltip'))}}\"                  onmouseleave=\"{{unhover()}}\">                  <input type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{uploadCovershot(domEvent)}}\"            accept=\"{{covershot_accept_string}}\" />                  <span>            {{string('upload-covershot')}}           </span>          </div>         </div>         <div class=\"{{css}}-rightbutton-container\" ba-show=\"{{rerecordvisible}}\">          <div class=\"{{css}}-button-primary\"                  onclick=\"{{rerecord()}}\"                  onmouseenter=\"{{hover(string('rerecord-tooltip'))}}\"                  onmouseleave=\"{{unhover()}}\">           {{string('rerecord')}}          </div>         </div>         <div class=\"{{css}}-rightbutton-container\" ba-show=\"{{stopvisible}}\">          <div class=\"{{css}}-button-primary\"                  onclick=\"{{stop()}}\"                  onmouseenter=\"{{hover(string('stop-tooltip'))}}\"                  onmouseleave=\"{{unhover()}}\">           {{string('stop')}}          </div>         </div>         <div class=\"{{css}}-centerbutton-container\" ba-show=\"{{skipvisible}}\">          <div class=\"{{css}}-button-primary\"                  onclick=\"{{skip()}}\"                  onmouseenter=\"{{hover(string('skip-tooltip'))}}\"                  onmouseleave=\"{{unhover()}}\">           {{string('skip')}}          </div>         </div>  </div> </div> ","video_recorder_imagegallery":"<div class=\"{{css}}-imagegallery-leftbutton\">  <div class=\"{{css}}-imagegallery-button-inner\" onclick=\"{{left()}}\">   <i class=\"ba-videorecorder-icon-left-open\"></i>  </div> </div>   <div ba-repeat=\"{{image::images}}\" class=\"{{css}}-imagegallery-container\" data-gallery-container>      <div class=\"{{css}}-imagegallery-image\"           ba-styles=\"{{{left: image.left + 'px', top: image.top + 'px', width: image.width + 'px', height: image.height + 'px'}}}\"           onclick=\"{{select(image)}}\">      </div> </div>   <div class=\"{{css}}-imagegallery-rightbutton\">  <div class=\"{{css}}-imagegallery-button-inner\" onclick=\"{{right()}}\">   <i class=\"ba-videorecorder-icon-right-open\"></i>  </div> </div> ","video_recorder_loader":" <div class=\"{{css}}-loader-container\">     <div class=\"{{css}}-loader-loader\" title=\"{{tooltip}}\">     </div> </div> <div class=\"{{css}}-loader-label\" ba-show=\"{{label}}\">  {{label}} </div>","video_recorder_message":" <div class=\"{{css}}-message-container\" ba-click=\"click()\">     <div class='{{css}}-message-message'>         {{message || \"\"}}     </div> </div>","recorder":" <div ba-show=\"{{!player_active}}\"      class=\"{{css}}-container {{css}}-size-{{csssize}} {{iecss}}-{{ie8 ? 'ie8' : 'noie8'}} {{csstheme}}\"      style=\"{{width ? 'width:' + width + ((width + '').match(/^\\d+$/g) ? 'px' : '') + ';' : 'width:100%;'}}{{height ? 'height:' + height + ((height + '').match(/^\\d+$/g) ? 'px' : '') + ';' : 'height:100%'}}\" >       <video class=\"{{css}}-video {{css}}-{{hasrecorder ? 'hasrecorder' : 'norecorder'}}\" data-video=\"video\"></video>     <div class='{{css}}-overlay' ba-show=\"{{!hideoverlay}}\" data-overlay=\"overlay\">   <ba-{{dynloader}}       ba-css=\"{{cssloader || css}}\"       ba-template=\"{{tmplloader}}\"       ba-show=\"{{loader_active}}\"       ba-tooltip=\"{{loadertooltip}}\"       ba-label=\"{{loaderlabel}}\"   ></ba-{{dynloader}}>      <ba-{{dynmessage}}       ba-css=\"{{cssmessage || css}}\"       ba-template=\"{{tmplmessage}}\"       ba-show=\"{{message_active}}\"       ba-message=\"{{message}}\"       ba-event:click=\"message_click\"   ></ba-{{dynmessage}}>    <ba-{{dyntopmessage}}       ba-css=\"{{csstopmessage || css}}\"       ba-template=\"{{tmpltopmessage}}\"       ba-show=\"{{topmessage_active && (topmessage || hovermessage)}}\"       ba-topmessage=\"{{hovermessage || topmessage}}\"   ></ba-{{dyntopmessage}}>      <ba-{{dynchooser}}       ba-css=\"{{csschooser || css}}\"       ba-template=\"{{tmplchooser}}\"       ba-show=\"{{chooser_active}}\"       ba-allowrecord=\"{{allowrecord}}\"       ba-allowupload=\"{{allowupload}}\"       ba-allowcustomupload=\"{{allowcustomupload}}\"       ba-primaryrecord=\"{{primaryrecord}}\"       ba-event:record=\"record_video\"       ba-event:upload=\"upload_video\"   ></ba-{{dynchooser}}>      <ba-{{dynimagegallery}}       ba-css=\"{{cssimagegallery || css}}\"       ba-template=\"{{tmplimagegallery}}\"       ba-if=\"{{imagegallery_active}}\"       ba-imagecount=\"{{gallerysnapshots}}\"       ba-imagenativewidth=\"{{recordingwidth}}\"       ba-imagenativeheight=\"{{recordingheight}}\"       ba-event:image-selected=\"select_image\"   ></ba-{{dynimagegallery}}>      <ba-{{dyncontrolbar}}       ba-css=\"{{csscontrolbar || css}}\"       ba-template=\"{{tmplcontrolbar}}\"       ba-show=\"{{controlbar_active}}\"       ba-cameras=\"{{cameras}}\"       ba-microphones=\"{{microphones}}\"       ba-noaudio=\"{{noaudio}}\"       ba-selectedcamera=\"{{selectedcamera || 0}}\"       ba-selectedmicrophone=\"{{selectedmicrophone || 0}}\"       ba-camerahealthy=\"{{camerahealthy}}\"       ba-microphonehealthy=\"{{microphonehealthy}}\"       ba-hovermessage=\"{{=hovermessage}}\"       ba-settingsvisible=\"{{settingsvisible}}\"       ba-recordvisible=\"{{recordvisible}}\"       ba-uploadcovershotvisible=\"{{uploadcovershotvisible}}\"       ba-rerecordvisible=\"{{rerecordvisible}}\"       ba-stopvisible=\"{{stopvisible}}\"       ba-skipvisible=\"{{skipvisible}}\"       ba-controlbarlabel=\"{{controlbarlabel}}\"       ba-event:select-camera=\"select_camera\"       ba-event:select-microphone=\"select_microphone\"       ba-event:invoke-record=\"record\"       ba-event:invoke-rerecord=\"rerecord\"       ba-event:invoke-stop=\"stop\"       ba-event:invoke-skip=\"invoke_skip\"       ba-event:upload-covershot=\"upload_covershot\"   ></ba-{{dyncontrolbar}}>     </div> </div>  <div ba-if=\"{{player_active}}\"      style=\"{{width ? 'width:' + width + ((width + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}{{height ? 'height:' + height + ((height + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}\" >  <ba-{{dynvideoplayer}} ba-theme=\"{{theme || 'default'}}\"                         ba-source=\"{{playbacksource}}\"                         ba-poster=\"{{playbackposter}}\"                         ba-hideoninactivity=\"{{false}}\"                         ba-forceflash=\"{{forceflash}}\"                         ba-noflash=\"{{noflash}}\"                         ba-stretch=\"{{stretch}}\"                         ba-attrs=\"{{playerattrs}}\"                         ba-data:id=\"player\"                         ba-width=\"{{width}}\"                         ba-height=\"{{height}}\"                         ba-rerecordable=\"{{rerecordable && (recordings === null || recordings > 0)}}\"                         ba-submittable=\"{{manualsubmit}}\"                         ba-reloadonplay=\"{{true}}\"                         ba-autoplay=\"{{autoplay}}\"                         ba-nofullscreen=\"{{nofullscreen}}\"                         ba-topmessage=\"{{playertopmessage}}\"                         ba-event:rerecord=\"rerecord\"                         ba-event:playing=\"playing\"                         ba-event:paused=\"paused\"                         ba-event:ended=\"ended\"                         ba-event:submit=\"manual_submit\"                         >  </ba-{{dynvideoplayer}}> </div>","video_recorder_topmessage":" <div class=\"{{css}}-topmessage-container\">     <div class='{{css}}-topmessage-background'>     </div>     <div class='{{css}}-topmessage-message'>         {{topmessage}}     </div> </div>","cube-video_player_controlbar":"<div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">      <div class=\"{{css}}-left-block\">          <div class=\"{{css}}-button-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">             <div class=\"{{css}}-button-inner\">                 {{string('submit-video')}}             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{rerecordable}}\" ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-ccw\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-play\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-pause\"></i>             </div>         </div>     </div>      <div class=\"{{css}}-right-block\">          <div class=\"{{css}}-button-container {{css}}-timer-container\">             <div class=\"{{css}}-time-container\">                 <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{duration_formatted}}</div>             </div>             <p> / </p>             <div class=\"{{css}}-time-container\">                 <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}</div>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-click=\"toggle_volume()\" title=\"{{string(volume > 0 ? 'volume-mute' : 'volume-unmute')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>             </div>         </div>           <div class=\"{{css}}-button-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">             <div class=\"{{css}}-button-inner {{css}}-stream-label-container\">                 <span class=\"{{css}}-button-text {{css}}-stream-label\">{{currentstream_label}}</span>             </div>         </div>          <div class=\"{{css}}-button-container\"  ba-click=\"toggle_fullscreen()\" title=\"{{string('fullscreen-video')}}\">             <div class=\"{{css}}-button-inner {{css}}-full-screen-btn-inner\">                 <i class=\"{{css}}-icon-resize-full\"></i>             </div>         </div>        </div>      <div class=\"{{css}}-progressbar\">         <div class=\"{{css}}-progressbar-inner\"              onmousedown=\"{{startUpdatePosition(domEvent)}}\"              onmouseup=\"{{stopUpdatePosition(domEvent)}}\"              onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"              onmousemove=\"{{progressUpdatePosition(domEvent)}}\">              <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>             <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\"></div>         </div>     </div>  </div> ","elevate-video_player_controlbar":" <div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">      <div class=\"{{css}}-top-block\">          <div class=\"{{css}}-top-right-block\">              <div class=\"{{css}}-time-container {{css}}-right-time-container\">                 <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{duration_formatted}}</div>             </div>          </div>          <div class=\"{{css}}-progressbar\">             <div class=\"{{css}}-progressbar-inner\"                  onmousedown=\"{{startUpdatePosition(domEvent)}}\"                  onmouseup=\"{{stopUpdatePosition(domEvent)}}\"                  onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"                  onmousemove=\"{{progressUpdatePosition(domEvent)}}\">                  <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>                 <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\">                     <div class=\"{{css}}-progressbar-button-description\" style=\"display: none\">                         <div class=\"{{css}}-current-stream-screen-shot\">                             <img src=\"\"/>                         </div>                         <div class=\"{{css}}-time-container\">                             <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}</div>                         </div>                     </div>                     <div class=\"{{css}}-progressbar-button\"></div>                 </div>             </div>         </div>      </div>      <div class=\"{{css}}-bottom-block\">          <div class=\"{{css}}-left-block\">              <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">                 <div class=\"{{css}}-button-inner\">                     {{string('submit-video')}}                 </div>             </div>              <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{rerecordable}}\" ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">                 <div class=\"{{css}}-button-inner\">                     <i class=\"{{css}}-icon-ccw\"></i>                 </div>             </div>              <div class=\"{{css}}-button-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">                 <div class=\"{{css}}-button-inner\">                     <i class=\"{{css}}-icon-play\"></i>                 </div>             </div>              <div class=\"{{css}}-button-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">                 <div class=\"{{css}}-button-inner\">                     <i class=\"{{css}}-icon-pause\"></i>                 </div>             </div>              <div class=\"{{css}}-button-container\" ba-click=\"toggle_volume()\" title=\"{{string(volume > 0 ? 'volume-mute' : 'volume-unmute')}}\">                 <div class=\"{{css}}-button-inner\">                     <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>                 </div>             </div>          </div>          <div class=\"{{css}}-center-block\">             <div class=\"{{css}}-video-title-block\">                              </div>         </div>          <div class=\"{{css}}-right-block\">              <div class=\"{{css}}-button-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">                 <div class=\"{{css}}-button-inner {{css}}-stream-label-container\">                     <span class=\"{{css}}-button-text {{css}}-stream-label\">{{currentstream_label}}</span>                 </div>             </div>              <div class=\"{{css}}-button-container\"  ba-click=\"toggle_fullscreen()\" title=\"{{string('fullscreen-video')}}\">                 <div class=\"{{css}}-button-inner {{css}}-full-screen-btn-inner\">                     <i class=\"{{css}}-icon-resize-full\"></i>                 </div>             </div>          </div>      </div> </div> ","minimalist-video_player_controlbar":" <div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">      <div class=\"{{css}}-controlbar-top-block\">          <div class=\"{{css}}-button-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">             <div class=\"{{css}}-button-inner\">                 {{string('submit-video')}}             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{rerecordable}}\" ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-ccw\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-play\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-pause\"></i>             </div>         </div>      </div>     <div class=\"{{css}}-controlbar-middle-block\">          <div class=\"{{css}}-progressbar\">             <div class=\"{{css}}-progressbar-inner\"                  onmousedown=\"{{startUpdatePosition(domEvent)}}\"                  onmouseup=\"{{stopUpdatePosition(domEvent)}}\"                  onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"                  onmousemove=\"{{progressUpdatePosition(domEvent)}}\">                  <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>                 <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\">                     <div class=\"{{css}}-progressbar-button\"></div>                 </div>             </div>         </div>      </div>     <div class=\"{{css}}-controlbar-bottom-block\">          <div class=\"{{css}}-button-container {{css}}-time-container\">             <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}</div>             <p> / </p>             <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{duration_formatted}}</div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">             <div class=\"{{css}}-button-inner {{css}}-stream-label-container\">                 <span class=\"{{css}}-button-text {{css}}-stream-label\">{{currentstream_label}}</span>             </div>         </div>     </div>  </div> ","minimalist-video_player_topmessage":"<div class=\"{{css}}-topmessage-container\">     <div class='{{css}}-topmessage-background'></div>     <div class='{{css}}-topmessage-message'>          <div class=\"{{css}}-right-block\">              <div class=\"{{css}}-button-container\"  ba-click=\"toggle_fullscreen()\">                 <div class=\"{{css}}-button-inner {{css}}-full-screen-btn-inner\">                     <i class=\"{{css}}-icon-resize-full\"></i>                 </div>             </div>              <div class=\"{{css}}-button-container\" ba-click=\"toggle_volume()\">                 <div class=\"{{css}}-button-inner\">                     <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>                 </div>             </div>          </div>          <div class=\"{{css}}-title\">{{topmessage}}</div>     </div>  </div> ","modern-video_player_controlbar":" <div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">         <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">             <div class=\"{{css}}-button-inner\">                 {{string('submit-video')}}             </div>         </div>        <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{rerecordable}}\" ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">            <div class=\"{{css}}-button-inner\">                <i class=\"{{css}}-icon-ccw\"></i>            </div>        </div>  <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">   <div class=\"{{css}}-button-inner\">    <i class=\"{{css}}-icon-play\"></i>   </div>  </div>  <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">    <div class=\"{{css}}-button-inner\">    <i class=\"{{css}}-icon-pause\"></i>   </div>  </div>  <div class=\"{{css}}-time-container\">   <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}/{{duration_formatted}}</div>  </div>  <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{fullscreen}}\" ba-click=\"toggle_fullscreen()\" title=\"{{string('fullscreen-video')}}\">   <div class=\"{{css}}-button-inner\">    <i class=\"{{css}}-icon-resize-full\"></i>   </div>  </div>  <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">   <div class=\"{{css}}-button-inner\">    <span class=\"{{css}}-button-text\">{{currentstream_label}}</span>   </div>  </div>  <div class=\"{{css}}-volumebar\">   <div class=\"{{css}}-volumebar-inner\"           onmousedown=\"{{startUpdateVolume(domEvent)}}\"                 onmouseup=\"{{stopUpdateVolume(domEvent)}}\"                 onmouseleave=\"{{stopUpdateVolume(domEvent)}}\"                 onmousemove=\"{{progressUpdateVolume(domEvent)}}\">    <div class=\"{{css}}-volumebar-position\" ba-styles=\"{{{width: Math.ceil(1+Math.min(99, Math.round(volume * 100))) + '%'}}}\" title=\"{{string('volume-button')}}\"></div>       </div>  </div>  <div class=\"{{css}}-rightbutton-container {{css}}-volume-button-container\" ba-click=\"toggle_volume()\" title=\"{{string(volume > 0 ? 'volume-mute' : 'volume-unmute')}}\">   <div class=\"{{css}}-button-inner\">    <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>   </div>  </div>  <div class=\"{{css}}-progressbar\">   <div class=\"{{css}}-progressbar-inner\"        onmousedown=\"{{startUpdatePosition(domEvent)}}\"        onmouseup=\"{{stopUpdatePosition(domEvent)}}\"        onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"        onmousemove=\"{{progressUpdatePosition(domEvent)}}\">   <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>   <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\"></div>  </div> </div> ","space-video_player_controlbar":" <div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">      <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">         <div class=\"{{css}}-button-inner\">             {{string('submit-video')}}         </div>     </div>      <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{rerecordable}}\" ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">         <div class=\"{{css}}-button-inner\">             <i class=\"{{css}}-icon-ccw\"></i>         </div>     </div>   <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">   <div class=\"{{css}}-button-inner\">    <i class=\"{{css}}-icon-play\"></i>   </div>  </div>   <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">   <div class=\"{{css}}-button-inner\">    <i class=\"{{css}}-icon-pause\"></i>   </div>  </div>   <div class=\"{{css}}-time-container\">   <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}</div>  </div>      <div class=\"{{css}}-rightbutton-container\"  ba-click=\"toggle_fullscreen()\" title=\"{{string('fullscreen-video')}}\">         <div class=\"{{css}}-button-inner {{css}}-full-screen-btn-inner\">             <i class=\"{{css}}-icon-resize-full\"></i>         </div>     </div>      <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">         <div class=\"{{css}}-button-inner {{css}}-stream-label-container\">             <span class=\"{{css}}-button-text {{css}}-stream-label\">{{currentstream_label}}</span>         </div>     </div>      <div class=\"{{css}}-time-container {{css}}-rightbutton-container\">         <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{duration_formatted}}</div>     </div>   <div class=\"{{css}}-progressbar\">   <div class=\"{{css}}-progressbar-inner\"        onmousedown=\"{{startUpdatePosition(domEvent)}}\"        onmouseup=\"{{stopUpdatePosition(domEvent)}}\"        onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"        onmousemove=\"{{progressUpdatePosition(domEvent)}}\">              <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>             <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\">                 <div class=\"{{css}}-progressbar-button\"></div>             </div>         </div>  </div> </div> ","space-video_player_topmessage":"<div class=\"{{css}}-topmessage-container\">     <div class='{{css}}-topmessage-background'>      </div>     <div class='{{css}}-topmessage-message'>         <div class=\"{{css}}-title\">{{topmessage}}</div>          <div class=\"{{css}}-rightbutton-container\" ba-click=\"toggle_volume()\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>             </div>         </div>          <div class=\"{{css}}-rightbutton-container {{css}}-share-button-container\" ba-click=\"share_media()\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-cog\"></i>             </div>         </div>     </div>  </div> ","theatre-video_player_controlbar":" <div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">      <div class=\"{{css}}-left-block\">          <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">             <div class=\"{{css}}-button-inner\">                 {{string('submit-video')}}             </div>         </div>          <div class=\"{{css}}-leftbutton-container\" ba-if=\"{{rerecordable}}\" ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-ccw\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-play\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{string('pause-video')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css}}-icon-pause\"></i>             </div>         </div>          <div class=\"{{css}}-button-container\" ba-click=\"toggle_volume()\" title=\"{{string(volume > 0 ? 'volume-mute' : 'volume-unmute')}}\">             <div class=\"{{css}}-button-inner\">                 <i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>             </div>         </div>          <div class=\"{{css}}-time-container\">             <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{position_formatted}}</div>         </div>     </div>      <div class=\"{{css}}-right-block\">          <div class=\"{{css}}-button-container {{css}}-fullscreen-icon-container\"  ba-click=\"toggle_fullscreen()\" title=\"{{string('fullscreen-video')}}\">             <div class=\"{{css}}-button-inner {{css}}-full-screen-btn-inner\">                 <i class=\"{{css}}-icon-resize-full\"></i>             </div>         </div>          <div class=\"{{css}}-button-container {{css}}-stream-label-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">             <div class=\"{{css}}-button-inner {{css}}-stream-label-container\">                 <span class=\"{{css}}-button-text {{css}}-stream-label\">{{currentstream_label}}</span>             </div>         </div>          <div class=\"{{css}}-time-container {{css}}-right-time-container\">             <div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{duration_formatted}}</div>         </div>      </div>      <div class=\"{{css}}-progressbar\">         <div class=\"{{css}}-progressbar-inner\"              onmousedown=\"{{startUpdatePosition(domEvent)}}\"              onmouseup=\"{{stopUpdatePosition(domEvent)}}\"              onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"              onmousemove=\"{{progressUpdatePosition(domEvent)}}\">              <div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>             <div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\">                 <div class=\"{{css}}-progressbar-button\"></div>             </div>         </div>     </div>  </div> ","cube-video_recorder_chooser":" <div class=\"{{css}}-chooser-container\">   <div class=\"{{css}}-chooser-button-container\">     <div class=\"{{css}}-chooser-icon-container\">    <i class=\"{{css}}-icon-{{primaryrecord ? 'videocam' : 'upload'}}\"></i>   </div>   <div>    <div class=\"{{css}}-chooser-primary-button\"         ba-click=\"primary()\"         ba-if=\"{{has_primary}}\">     <input ba-if=\"{{enable_primary_select && primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\"            capture />     <input ba-if=\"{{enable_primary_select && !primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\" />     <span>      {{primary_label}}     </span>    </div>   </div>   <div>    <div class=\"{{css}}-chooser-secondary-button\"         ba-click=\"secondary()\"         ba-if=\"{{has_secondary}}\">     <input ba-if=\"{{enable_secondary_select && secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <input ba-if=\"{{enable_secondary_select && !secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <span>      {{secondary_label}}     </span>    </div>   </div>  </div> </div>","theatre-video_recorder_chooser":" <div class=\"{{css}}-chooser-container\">   <div class=\"{{css}}-chooser-button-container\">     <div class=\"{{css}}-chooser-icon-container\">    <i class=\"{{css}}-icon-{{primaryrecord ? 'videocam' : 'upload'}}\"></i>   </div>   <div>    <div class=\"{{css}}-chooser-primary-button\"         ba-click=\"primary()\"         ba-if=\"{{has_primary}}\">     <input ba-if=\"{{enable_primary_select && primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\"            capture />     <input ba-if=\"{{enable_primary_select && !primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\" />     <span>      {{primary_label}}     </span>    </div>   </div>   <div>    <div class=\"{{css}}-chooser-secondary-button\"         ba-click=\"secondary()\"         ba-if=\"{{has_secondary}}\">     <input ba-if=\"{{enable_secondary_select && secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <input ba-if=\"{{enable_secondary_select && !secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <span>      {{secondary_label}}     </span>    </div>   </div>  </div> </div>","modern-video_recorder_chooser":" <div class=\"{{css}}-chooser-container\">   <div class=\"{{css}}-chooser-button-container\">     <div class=\"{{css}}-chooser-icon-container\">    <i class=\"{{css}}-icon-{{primaryrecord ? 'videocam' : 'upload'}}\"></i>   </div>   <div>    <div class=\"{{css}}-chooser-primary-button\"         ba-click=\"primary()\"         ba-if=\"{{has_primary}}\">     <input ba-if=\"{{enable_primary_select && primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\"            capture />     <input ba-if=\"{{enable_primary_select && !primary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{primary_select(domEvent)}}\"            accept=\"{{primary_accept_string}}\" />     <span>      {{primary_label}}     </span>    </div>   </div>   <div>    <div class=\"{{css}}-chooser-secondary-button\"         ba-click=\"secondary()\"         ba-if=\"{{has_secondary}}\">     <input ba-if=\"{{enable_secondary_select && secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <input ba-if=\"{{enable_secondary_select && !secondary_select_capture}}\"            type=\"file\"            class=\"{{css}}-chooser-file\"            style=\"height:100\"            onchange=\"{{secondary_select(domEvent)}}\"            accept=\"{{secondary_accept_string}}\" />     <span>      {{secondary_label}}     </span>    </div>   </div>  </div> </div>"};
});
Scoped.extend("module:Assets", ["module:Assets"], function (Assets) {
    var languages = {"language:de":{"ba-videoplayer-playbutton.tooltip":"Hier clicken um Wiedergabe zu starten.","ba-videoplayer-playbutton.rerecord":"Video neu aufnehmen","ba-videoplayer-playbutton.submit-video":"Video akzeptieren","ba-videoplayer-loader.tooltip":"Video wird geladen...","ba-videoplayer-controlbar.change-resolution":"Aufl&#xF6;sung anpassen","ba-videoplayer-controlbar.video-progress":"Videofortschritt","ba-videoplayer-controlbar.rerecord-video":"Video erneut aufnehmen?","ba-videoplayer-controlbar.submit-video":"Video akzeptieren","ba-videoplayer-controlbar.play-video":"Video wiedergeben","ba-videoplayer-controlbar.pause-video":"Video pausieren","ba-videoplayer-controlbar.elapsed-time":"Vergangene Zeit","ba-videoplayer-controlbar.total-time":"L&#xE4;nge des Videos","ba-videoplayer-controlbar.fullscreen-video":"Vollbildmodus","ba-videoplayer-controlbar.volume-button":"Lautst&#xE4;rke regulieren","ba-videoplayer-controlbar.volume-mute":"Ton abstellen","ba-videoplayer-controlbar.volume-unmute":"Ton wieder einstellen","ba-videoplayer.video-error":"Es ist ein Fehler aufgetreten, bitte versuchen Sie es sp&#xE4;ter noch einmal. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder-chooser.record-video":"Video aufnehmen","ba-videorecorder-chooser.upload-video":"Video hochladen","ba-videorecorder-controlbar.settings":"Einstellungen","ba-videorecorder-controlbar.camerahealthy":"Gute Beleuchtung","ba-videorecorder-controlbar.cameraunhealthy":"Beleuchtung nicht optimal","ba-videorecorder-controlbar.microphonehealthy":"Soundqualit&#xE4;t einwandfrei","ba-videorecorder-controlbar.microphoneunhealthy":"Mikrofon bis jetzt stumm","ba-videorecorder-controlbar.record":"Video aufnehmen","ba-videorecorder-controlbar.record-tooltip":"Hier clicken um Aufnahme zu starten.","ba-videorecorder-controlbar.rerecord":"Video neu aufnehmen","ba-videorecorder-controlbar.rerecord-tooltip":"Hier clicken um Video erneut aufzunehmen.","ba-videorecorder-controlbar.upload-covershot":"Hochladen","ba-videorecorder-controlbar.upload-covershot-tooltip":"Hier clicken um einen Covershot hochzuladen.","ba-videorecorder-controlbar.stop":"Aufnahme stoppen","ba-videorecorder-controlbar.stop-tooltip":"Hier clicken um Aufnahme zu stoppen.","ba-videorecorder-controlbar.skip":"&#xDC;berspringen","ba-videorecorder-controlbar.skip-tooltip":"Hier clicken um zu &#xDC;berspringen.","ba-videorecorder.recorder-error":"Es ist ein Fehler aufgetreten, bitte versuchen Sie es sp&#xE4;ter noch einmal. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder.attach-error":"Wir konnten nicht auf die Kamera zugreifen. Je nach Browser und Ger&#xE4;t muss m&#xF6;glicherweise Flash installiert oder die Seite &#xFC;ber SSL geladen werden.","ba-videorecorder.access-forbidden":"Kamerazugriff wurde verweigert. Hier klick, um es noch einmal zu probieren.","ba-videorecorder.pick-covershot":"Bitte w&#xE4;hlen Sie einen Covershot aus.","ba-videorecorder.uploading":"Hochladen","ba-videorecorder.uploading-failed":"Hochladen fehlgeschlagen. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder.verifying":"Verifizieren","ba-videorecorder.verifying-failed":"Verifizierung fehlgeschlagen. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder.rerecord-confirm":"M&#xF6;chten Sie Ihr Video wirklich noch einmal aufnehmen?","ba-videorecorder.video_file_too_large":"Die angegebene Videodatei ist zu gro&#xDF;. Hier klicken, um eine kleinere Videodatei hochzuladen.","ba-videorecorder.unsupported_video_type":"Bitte laden Sie Dateien des folgenden Typs hoch: %s. Hier klicken, um es noch einmal zu probieren."}};
    for (var language in languages)
        Assets.strings.register(languages[language], [language]);
    return {};
});

Scoped.define("module:Ads.AdSenseVideoAdProvider", [
		"module:Ads.AbstractVideoAdProvider", "module:Ads.AdSensePrerollAd" ],
function(AbstractVideoAdProvider, AdSensePrerollAd, scoped) {
	return AbstractVideoAdProvider.extend({
		scoped : scoped
	}, {

		_newPrerollAd : function(options) {
			return new AdSensePrerollAd(this, options);
		}

	});
});


Scoped.define("module:Ads.AdSensePrerollAd", [
  	"module:Ads.AbstractPrerollAd"
  ], function (AbstractVideoPrerollAd, scoped) {
  	return AbstractVideoPrerollAd.extend({scoped: scoped}, function (inherited) {
  		return {
  				
  			constructor: function (provider, options) {
  				inherited.constructor.call(this, provider, options);
  				this._adDisplayContainer = new google.ima.AdDisplayContainer(this._options.adElement, this._options.videoElement);
  				// Must be done as the result of a user action on mobile
  				this._adDisplayContainer.initialize();
  				//Re-use this AdsLoader instance for the entire lifecycle of your page.
  				this._adsLoader = new google.ima.AdsLoader(this._adDisplayContainer);
  	
  				var self = this;
  				this._adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function () {
  					self._adError();
  				}, false);
  				this._adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function () {
  					self._adLoaded.apply(self, arguments);
  				}, false);
  				
  				this._adsRequest = new google.ima.AdsRequest();
  				this._adsRequest.adTagUrl = this._provider.options().adTagUrl;
  			},
  			
  			_executeAd: function (options) {
  				// Specify the linear and nonlinear slot sizes. This helps the SDK to
  				// select the correct creative if multiple are returned.
  				this._adsRequest.linearAdSlotWidth = options.width;
  				this._adsRequest.linearAdSlotHeight = options.height;
  				// adsRequest.nonLinearAdSlotWidth = 640;
  				// adsRequest.nonLinearAdSlotHeight = 150;
  				
  				this._adsLoader.requestAds(this._adsRequest);
  			},
  			
  			_adError: function () {
  				if (this._adsManager)
  					this._adsManager.destroy();
  				this._adFinished();
  			},
  			
  			_adLoaded: function (adsManagerLoadedEvent) {
  				  // Get the ads manager.
  				  this._adsManager = adsManagerLoadedEvent.getAdsManager(this._options.videoElement);
  				  // See API reference for contentPlayback
  				
  				  try {
  					    // Initialize the ads manager. Ad rules playlist will start at this time.
  					  this._adsManager.init(this._adsRequest.linearAdSlotWidth, this._adsRequest.linearAdSlotHeight, google.ima.ViewMode.NORMAL);
  					    // Call start to show ads. Single video and overlay ads will
  					    // start at this time; this call will be ignored for ad rules, as ad rules
  					    // ads start when the adsManager is initialized.
  					  this._adsManager.start();
  					  } catch (adError) {
  					    // An error may be thrown if there was a problem with the VAST response.
  					  }
  	
  				  var self = this;
  				  // Add listeners to the required events.
  				  this._adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function () {
  				      self._adError();
  				  }, false);
  				
  				  //this._adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, function () {});
  				  this._adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, function () {
  					  self._adFinished();
  				  });
  			}
  		
  		};	
  	});
  });

Scoped.define("module:Ads.AbstractVideoAdProvider", [ "base:Class" ], function(
		Class, scoped) {
	return Class.extend({
		scoped : scoped
	}, function(inherited) {
		return {

			constructor : function(options) {
				inherited.constructor.call(this);
				this._options = options;
			},

			options : function() {
				return this._options;
			},

			_newPrerollAd : function(options) {
			},

			newPrerollAd : function(options) {
				return this._newPrerollAd(options);
			},
			
			register: function (name) {
				this.cls.registry[name] = this;
			}

		};
	}, {
		
		registry: {}
		
	});
});


Scoped.define("module:Ads.AbstractPrerollAd", [ "base:Class",
		"base:Events.EventsMixin", "jquery:" ], function(Class, EventsMixin, $, scoped) {
	return Class.extend({
		scoped : scoped
	}, [ EventsMixin, function(inherited) {
		return {

			constructor : function(provider, options) {
				inherited.constructor.call(this);
				this._provider = provider;
				this._options = options;
			},

			executeAd : function(options) {
				$(this._options.adElement).show();
				this._executeAd(options);
			},

			_adFinished : function() {
				$(this._options.adElement).hide();
				this.trigger("finished");
			}

		};
	} ]);
});

Scoped.define("module:Assets", [
    "base:Classes.LocaleTable",
    "browser:Info"
], function (LocaleTable, Info) {
	
	var strings = new LocaleTable();
	strings.setWeakLocale(Info.language());
	
	return {
		
		strings: strings,
		
		playerthemes: {},
		
		recorderthemes: {}
		
	};
});
Scoped.define("module:VideoPlayer.Dynamics.Controlbar", [
    "dynamics:Dynamic",
    "base:TimeFormat",
    "base:Comparators",
    "module:Templates",
    "jquery:",
    "module:Assets",
    "browser:Info",
    "media:Player.Support"
], [
    "dynamics:Partials.StylesPartial",
    "dynamics:Partials.ShowPartial",
    "dynamics:Partials.IfPartial",
    "dynamics:Partials.ClickPartial"
], function (Class, TimeFormat, Comparators, Templates, $, Assets, Info, PlayerSupport, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_player_controlbar,
			
			attrs: {
				"css": "ba-videoplayer",
				"duration": 0,
				"position": 0,
				"cached": 0,
				"volume": 1.0,
				"expandedprogress": true,
				"playing": false,
				"rerecordable": false,
				"submittable": false,
				"streams": [],
				"currentstream": null,
				"fullscreen": true,
				"activitydelta": 0
			},
			
			computed: {
				"currentstream_label:currentstream": function () {
					var cs = this.get("currentstream");
					return cs ? (cs.label ? cs.label : PlayerSupport.resolutionToLabel(cs.width, cs.height)): "";
				}
			},
			
			functions: {
				
				startUpdatePosition: function (event) {
					event[0].preventDefault();
					this.set("_updatePosition", true);
					this.call("progressUpdatePosition", event);
				},
				
				progressUpdatePosition: function (event) {
					event[0].preventDefault();
					if (!this.get("_updatePosition"))
						return;
					this.set("position", this.get("duration") * (event[0].clientX - $(event[0].currentTarget).offset().left) / $(event[0].currentTarget).width());
					this.trigger("position", this.get("position"));
				},
				
				stopUpdatePosition: function (event) {
					event[0].preventDefault();
					this.set("_updatePosition", false);
				},
				
				startUpdateVolume: function (event) {
					event[0].preventDefault();
					this.set("_updateVolume", true);
					this.call("progressUpdateVolume", event);
				},
				
				progressUpdateVolume: function (event) {
					event[0].preventDefault();
					if (!this.get("_updateVolume"))
						return;
					this.set("volume", (event[0].clientX - $(event[0].currentTarget).offset().left) / $(event[0].currentTarget).width());
					this.trigger("volume", this.get("volume"));
				},
				
				stopUpdateVolume: function (event) {
					event[0].preventDefault();
					this.set("_updateVolume", false);
				},

				play: function () {
					this.trigger("play");
				},
				
				pause: function () {
					this.trigger("pause");
				},
				
				toggle_volume: function () {
					if (this.get("volume") > 0) {
						this.__oldVolume = this.get("volume");
						this.set("volume", 0);
					} else 
						this.set("volume", this.__oldVolume || 1);
					this.trigger("volume", this.get("volume"));
				},
				
				toggle_fullscreen: function () {
					this.trigger("fullscreen");
				},
				
				rerecord: function () {
					this.trigger("rerecord");
				},
				
				submit: function () {
					this.set("submittable", false);
					this.set("rerecordable", false);
					this.trigger("submit");
				},
				
				toggle_stream: function () {
					var streams = this.get("streams");
					var current = streams.length - 1;
					streams.forEach(function (stream, i) {
						if (Comparators.deepEqual(stream, this.get("currentstream")))
							current = i;
					}, this);
					this.set("currentstream", streams[(current + 1) % streams.length]);
				}
				
			},
			
			create: function () {
				this.properties().compute("position_formatted", function () {
					return TimeFormat.format(TimeFormat.ELAPSED_MINUTES_SECONDS, this.get("position") * 1000);
				}, ['position']);
				this.properties().compute("duration_formatted", function () {
					return TimeFormat.format(TimeFormat.ELAPSED_MINUTES_SECONDS, this.get("duration") * 1000);
				}, ['duration']);
				this.set("ismobile", Info.isMobile());
			}
			
		};
	})
	.register("ba-videoplayer-controlbar")
    .attachStringTable(Assets.strings)
    .addStrings({
    	"video-progress": "Video progress",
    	"rerecord-video": "Redo video?",
    	"submit-video": "Confirm video",
    	"play-video": "Play video",
    	"pause-video": "Pause video",
    	"elapsed-time": "Elasped time",
    	"total-time": "Total length of video",
    	"fullscreen-video": "Enter fullscreen",
    	"volume-button": "Set volume",
    	"volume-mute": "Mute sound",
    	"volume-unmute": "Unmute sound",
    	"change-resolution": "Change resolution"
    });
});
Scoped.define("module:VideoPlayer.Dynamics.Loader", [
    "dynamics:Dynamic",
    "module:Templates",
    "module:Assets"
], function (Class, Templates, Assets, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_player_loader,
			
			attrs: {
				"css": "ba-videoplayer"
			}
			
		};
	})
	.register("ba-videoplayer-loader")
    .attachStringTable(Assets.strings)
    .addStrings({
    	"tooltip": "Loading video..."
    });
});
Scoped.define("module:VideoPlayer.Dynamics.Message", [
    "dynamics:Dynamic",
    "module:Templates"
], [
    "dynamics:Partials.ClickPartial"
], function (Class, Templates, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_player_message,
			
			attrs: {
				"css": "ba-videoplayer",
				"message": ''
			},
			
			functions: {
				
				click: function () {
					this.trigger("click");
				}
				
			}
			
		};
	}).register("ba-videoplayer-message");
});
Scoped.define("module:VideoPlayer.Dynamics.Playbutton", [
    "dynamics:Dynamic",
    "module:Templates",
    "module:Assets"
], [
    "dynamics:Partials.ClickPartial"
], function (Class, Templates, Assets, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.playbutton,
			
			attrs: {
				"css": "ba-videoplayer",
				"rerecordable": false,
				"submittable": false
			},
			
			functions: {
				
				play: function () {
					this.trigger("play");
				},
				
				submit: function () {
					this.set("submittable", false);
					this.set("rerecordable", false);
					this.trigger("submit");
				},

				rerecord: function () {
					this.trigger("rerecord");
				}				
				
			}
			
		};
	})
	.register("ba-videoplayer-playbutton")
    .attachStringTable(Assets.strings)
    .addStrings({
    	"tooltip": "Click to play video.",
    	"rerecord": "Redo",
    	"submit-video": "Confirm video"    	
    });
});
Scoped.define("module:VideoPlayer.Dynamics.Player", [
    "dynamics:Dynamic",
    "module:Templates",
    "module:Assets",
    "browser:Info",
    "media:Player.VideoPlayerWrapper",
    "base:Types",
    "base:Objs",
    "base:Strings",
    "base:Time",
    "base:Timers",
    "base:States.Host",
    "base:Classes.ClassRegistry",
    "module:VideoPlayer.Dynamics.PlayerStates.Initial",
    "module:VideoPlayer.Dynamics.PlayerStates",
    "module:Ads.AbstractVideoAdProvider"
], [
    "module:VideoPlayer.Dynamics.Playbutton",
    "module:VideoPlayer.Dynamics.Message",
    "module:VideoPlayer.Dynamics.Loader",
    "module:VideoPlayer.Dynamics.Controlbar",
    "dynamics:Partials.EventPartial",
    "dynamics:Partials.OnPartial",
    "dynamics:Partials.TemplatePartial"
], function (Class, Templates, Assets, Info, VideoPlayerWrapper, Types, Objs, Strings, Time, Timers, Host, ClassRegistry, InitialState, PlayerStates, AdProvider, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.player,
			
			attrs: {
				/* CSS */
				"css": "ba-videoplayer",
				"iecss": "ba-videoplayer",
				"cssplaybutton": "",
				"cssloader": "",
				"cssmessage": "",
				"csstopmessage": "",
				"csscontrolbar": "",
				"width": "",
				"height": "",
				/* Themes */
				"theme": "",
				"csstheme": "",
				/* Dynamics */
				"dynplaybutton": "videoplayer-playbutton",
				"dynloader": "videoplayer-loader",
				"dynmessage": "videoplayer-message",
				"dyntopmessage": "videoplayer-topmessage",
				"dyncontrolbar": "videoplayer-controlbar",
				/* Templates */
				"tmplplaybutton": "",
				"tmplloader": "",
				"tmplmessage": "",
				"tmpltopmessage": "",
				"tmplcontrolbar": "",
				/* Attributes */
				"poster": "",
				"source": "",
				"sources": [],
				"sourcefilter": {},
				"streams": [],
				"currentstream": null,
				"playlist": null,
				"volume": 1.0,
				/* Configuration */
				"forceflash": false,
				"noflash": false,
				"reloadonplay": false,
				/* Ads */
				"adprovider": null,
				"preroll": false,
				/* Options */
				"rerecordable": false,
				"submittable": false,
				"autoplay": false,
				"preload": false,
				"loop": false,
				"nofullscreen": false,
				"ready": true,
				"stretch": false,
				"hideoninactivity": true,
				"skipinitial": false,
				"topmessage": "",
				/* States */
				"states": {
					"poster_error": {
						"ignore": false,
						"click_play": true
					}
				}				
			},

			types: {
				"forceflash": "boolean",
				"noflash": "boolean",
				"rerecordable": "boolean",
				"loop": "boolean",
				"autoplay": "boolean",
				"preload": "boolean",
				"ready": "boolean",
				"nofullscreen": "boolean",
				"stretch": "boolean",
				"preroll": "boolean",
				"hideoninactivity": "boolean",
				"skipinitial": "boolean",
				"volume": "float"
			},
			
			extendables: ["states"],
			
			remove_on_destroy: true,
			
			create: function () {
				if (Info.isMobile()) {
					this.set("autoplay", false);
					this.set("loop", false);
				}
				if (this.get("theme") in Assets.playerthemes) {
					Objs.iter(Assets.playerthemes[this.get("theme")], function (value, key) {
						if (!this.isArgumentAttr(key))
							this.set(key, value);
					}, this);
				}
				if (this.get("adprovider")) {
					this._adProvider = this.get("adprovider");
					if (Types.is_string(this._adProvider))
						this._adProvider = AdProvider.registry[this._adProvider];
				}
				if (this.get("playlist")) {
					var pl0 = (this.get("playlist"))[0];
					this.set("poster", pl0.poster);
					this.set("source", pl0.source);
					this.set("sources", pl0.sources);
				}
				if (this.get("streams") && !this.get("currentstream"))
					this.set("currentstream", (this.get("streams"))[0]);
				this.set("ie8", Info.isInternetExplorer() && Info.internetExplorerVersion() < 9);
				this.set("duration", 0.0);
				this.set("position", 0.0);
				this.set("buffered", 0.0);
				this.set("message", "");
				this.set("fullscreensupport", false);
				this.set("csssize", "normal");
				
				this.set("loader_active", false);
				this.set("playbutton_active", false);
				this.set("controlbar_active", false);
				this.set("message_active", false);

				this.set("last_activity", Time.now());
				this.set("activity_delta", 0);
				
				this.set("playing", false);
				
				this.__attachRequested = false;
				this.__activated = false;
				this.__error = null;
				this.__currentStretch = null;
				
				this.on("change:stretch", function () {
					this._updateStretch();
				}, this);
				this.host = this.auto_destroy(new Host({
					stateRegistry: new ClassRegistry(this.cls.playerStates())
				}));
				this.host.dynamic = this;
				this.host.initialize(InitialState);
				
				this._timer = this.auto_destroy(new Timers.Timer({
					context: this,
					fire: this._timerFire,
					delay: 100,
					start: true
				}));
				
				this.properties().compute("buffering", function () {
					return this.get("playing") && this.get("buffered") < this.get("position") && this.get("last_position_change_delta") > 1000;
				}, ["buffered", "position", "last_position_change_delta", "playing"]);
				
			},
			
			state: function () {
				return this.host.state();
			},
			
			videoAttached: function () {
				return !!this.player;
			},
			
			videoLoaded: function () {
				return this.videoAttached() && this.player.loaded();
			},
			
			videoError: function () {
				return this.__error;
			},
			
			_error: function (error_type, error_code) {
				this.__error = {
					error_type: error_type,
					error_code: error_code
				};
				this.trigger("error:" + error_type, error_code);
				this.trigger("error", error_type, error_code);
			},
			
			_clearError: function () {
				this.__error = null;
			},
			
			_detachVideo: function () {
				this.set("playing", false);
				if (this.player)
					this.player.weakDestroy();
				if (this._prerollAd)
					this._prerollAd.weakDestroy();
				this.player = null;
			},
			
			_attachVideo: function () {
				if (this.videoAttached())
					return;
				if (!this.__activated) {
					this.__attachRequested = true;
					return;
				}
				this.__attachRequested = false;
				var video = this.element().find("[data-video='video']").get(0);
				this._clearError();
				VideoPlayerWrapper.create(Objs.extend(this._getSources(), {
			    	element: video,
			    	forceflash: !!this.get("forceflash"),
			    	noflash: !!this.get("noflash"),
			    	preload: !!this.get("preload"),
					loop: !!this.get("loop"),
					reloadonplay: !!this.get("reloadonplay")
			    })).error(function (e) {
			    	if (this.destroyed())
			    		return;
			    	this._error("attach", e);
			    }, this).success(function (instance) {
			    	if (this.destroyed())
			    		return;
					if (this._adProvider && this.get("preroll")) {
						this._prerollAd = this._adProvider.newPrerollAd({
							videoElement: this.element().find("[data-video='video']").get(0),
							adElement: this.element().find("[data-video='ad']").get(0)
						});
					}
			    	this.player = instance;			    	
					this.player.on("postererror", function () {
				    	this._error("poster");
					}, this);					
					this.player.on("playing", function () {
						this.set("playing", true);
						this.trigger("playing");
					}, this);
					this.player.on("error", function (e) {
						this._error("video", e);
					}, this);
			        if (this.player.error())
			        	this.player.trigger("error", this.player.error());
			        this.player.on("paused", function () {
			        	this.set("playing", false);
			        	this.trigger("paused");
			        }, this);
					this.player.on("ended", function () {
						this.set("playing", false);
						this.trigger("ended");
					}, this);
			    	this.trigger("attached", instance);
					this.player.once("loaded", function () {
						var volume = Math.min(1.0, this.get("volume"));
						this.player.setVolume(volume);
						this.player.setMuted(volume <= 0);
						this.set("duration", this.player.duration());
						this.set("fullscreensupport", this.player.supportsFullscreen());
						this.trigger("loaded");
						this._updateStretch();
					}, this);
					if (this.player.loaded())
						this.player.trigger("loaded");
					this._updateStretch();
			    }, this);
			},
			
			_getSources: function () {
				var filter = this.get("currentstream") ? this.get("currentstream").filter : this.get("sourcefilter");
				var poster = this.get("poster");
				var source = this.get("source");
				var sources = filter ? Objs.filter(this.get("sources"), function (source) {
					return Objs.subset_of(filter, source);
				}, this) : this.get("sources");
				Objs.iter(sources, function (s) {
					if (s.poster)
						poster = s.poster;
				});
				return {
					poster: poster,
					source: source,
					sources: sources
				};
			},
			
			_afterActivate: function (element) {
				inherited._afterActivate.call(this, element);
				this.__activated = true;
				if (this.__attachRequested)
					this._attachVideo();
			},
			
			reattachVideo: function () {
				this._detachVideo();
				this._attachVideo();
			},

			object_functions: ["play", "rerecord", "pause", "stop", "seek", "set_volume"],
			
			functions: {
				
				user_activity: function () {
					this.set("last_activity", Time.now());
					this.set("activity_delta", 0);
				},
				
				message_click: function () {
					this.trigger("message:click");
				},
				
				playbutton_click: function () {
					this.host.state().play();
				},
				
				play: function () {
					this.host.state().play();
				},
				
				rerecord: function () {
					if (!this.get("rerecordable"))
						return;
					this.trigger("rerecord");
				},
				
				submit: function () {
					if (!this.get("submittable"))
						return;
					this.trigger("submit");
					this.set("submittable", false);
					this.set("rerecordable", false);
				},

				pause: function () {
					if (this.get("playing"))
						this.player.pause();
				},
				
				stop: function () {
					if (!this.videoLoaded())
						return;
					if (this.get("playing"))
						this.player.pause();
					this.player.setPosition(0);
					this.trigger("stopped");
				},			
				
				seek: function (position) {
					if (this.videoLoaded())
						this.player.setPosition(position);
					this.trigger("seek", position);
				},

				set_volume: function (volume) {
					volume = Math.min(1.0, volume);
					this.set("volume", volume);
					if (this.videoLoaded()) {
						this.player.setVolume(volume);
						this.player.setMuted(volume <= 0);
					}
				},
				
				toggle_fullscreen: function () {
					if (this.videoLoaded())
						this.player.enterFullscreen();
				} 
			
			},
			
			destroy: function () {
				this._detachVideo();
				inherited.destroy.call(this);
			},
			
			_timerFire: function () {
				if (this.destroyed())
					return;
				try {
					if (this.videoLoaded()) {
						this.set("activity_delta", Time.now() - this.get("last_activity"));
						var new_position = this.player.position();
						if (new_position != this.get("position") || this.get("last_position_change"))
							this.set("last_position_change", Time.now());
						this.set("last_position_change_delta", Time.now() - this.get("last_position_change"));
						this.set("position", new_position);
						this.set("buffered", this.player.buffered());
						this.set("duration", this.player.duration());
					}
				} catch (e) {}
				this._updateStretch();
				this._updateCSSSize();
			},
			
			_updateCSSSize: function () {
				this.set("csssize", this.element().width() > 400 ? "normal" : (this.element().width() > 300 ? "medium" : "small"));
			},
			
			videoHeight: function () {
				return this.videoAttached() ? this.player.videoHeight() : NaN;
			},
			
			videoWidth: function () {
				return this.videoAttached() ? this.player.videoWidth() : NaN;
			},
			
			aspectRatio: function () {
				return this.videoWidth() / this.videoHeight();
			},
			
			parentWidth: function () {
				return this.activeElement().parent().width();
			},
			
			parentHeight: function () {
				return this.activeElement().parent().height();
			},

			parentAspectRatio: function () {
				return this.parentWidth() / this.parentHeight();
			},
			
			_updateStretch: function () {
				var newStretch = null;
				if (this.get("stretch")) {
					var ar = this.aspectRatio();
					if (isFinite(ar)) {
						var par = this.parentAspectRatio();
						if (isFinite(par)) {
							if (par > ar)
								newStretch = "height";
							if (par < ar)
								newStretch = "width";
						} else if (par === Infinity)
							newStretch = "height";
					}
				}
				if (this.__currentStretch !== newStretch) {
					if (this.__currentStretch)
						this.activeElement().removeClass(this.get("css") + "-stretch-" + this.__currentStretch);
					if (newStretch)
						this.activeElement().addClass(this.get("css") + "-stretch-" + newStretch);
				}
				this.__currentStretch = newStretch;				
			}

		};
	}, {
		
		playerStates: function () {
			return [PlayerStates];
		}
		
	}).register("ba-videoplayer")
	.attachStringTable(Assets.strings)
    .addStrings({
    	"video-error": "An error occurred, please try again later. Click to retry."
    });
});
Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.State", [
    "base:States.State",
    "base:Events.ListenMixin",
    "base:Objs"
], function (State, ListenMixin, Objs, scoped) {
	return State.extend({scoped: scoped}, [ListenMixin, {

		dynamics: [],
	
		_start: function () {
			this.dyn = this.host.dynamic;
			Objs.iter(Objs.extend({
				"loader": false,
				"message": false,
				"playbutton": false,
				"controlbar": false
			}, Objs.objectify(this.dynamics)), function (value, key) {
				this.dyn.set(key + "_active", value);
			}, this);
			this._started();
		},
		
		_started: function () {},
		
		play: function () {
			this.dyn.set("autoplay", true);
		}
	
	}]);
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.FatalError", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["message"],
		_locals: ["message"],

		_started: function () {
			this.dyn.set("message", this._message || this.dyn.string("video-error"));
		}

	});
});






Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.Initial", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, { 
		
		dynamics: ["loader"],

		_started: function () {
			if (this.dyn.get("ready"))
				this.next("LoadPlayer");
			else {
				this.listenOn(this.dyn, "change:ready", function () {
					this.next("LoadPlayer");
				});
			}
		}
	});
});


Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.LoadPlayer", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
			
		dynamics: ["loader"],

		_started: function () {
			this.listenOn(this.dyn, "error:attach", function () {
				this.next("LoadError");
			}, this);
			this.listenOn(this.dyn, "error:poster", function () {
				if (!this.dyn.get("states").poster_error.ignore)
					this.next("PosterError");
			}, this);
			this.listenOn(this.dyn, "attached", function () {
				this.next("PosterReady");
			}, this);
			this.dyn.reattachVideo();
		}
	
	});
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.LoadError", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["message"],

		_started: function () {
			this.dyn.set("message", this.dyn.string("video-error"));
			this.listenOn(this.dyn, "message:click", function () {
				this.next("LoadPlayer");
			}, this);
		}

	});
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.PosterReady", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["playbutton"],

		_started: function () {
			this.listenOn(this.dyn, "error:poster", function () {
				if (!this.dyn.get("states").poster_error.ignore)
					this.next("PosterError");
			}, this);
			if (this.dyn.get("autoplay") || this.dyn.get("skipinitial"))
				this.play();
		},
		
		play: function () {
			this.next("Preroll");
		}

	});
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.Preroll", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: [],

		_started: function () {
			if (this.dyn._prerollAd) {
				this.dyn._prerollAd.once("finished", function () {
					this.next("LoadVideo");
				}, this);
				this.dyn._prerollAd.executeAd({
					width: this.dyn.videoWidth(),
					height: this.dyn.videoHeight()
				});
			} else
				this.next("LoadVideo");
		}

	});
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.PosterError", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["message"],
		
		_started: function () {
			this.dyn.set("message", this.dyn.string("video-error"));
			this.listenOn(this.dyn, "message:click", function () {
				this.next(this.dyn.get("states").poster_error.click_play ? "LoadVideo" : "LoadPlayer");
			}, this);
		}

	});
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.LoadVideo", [
	"module:VideoPlayer.Dynamics.PlayerStates.State",
	"base:Async"
], function (State, Async, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["loader"],

		_started: function () {
			this.listenOn(this.dyn, "error:video", function () {
				this.next("ErrorVideo");
			}, this);
			this.listenOn(this.dyn, "playing", function () {
				if (this.destroyed() || this.dyn.destroyed())
					return;
				if (this.dyn.get("autoseek"))
					this.dyn.execute("seek", this.dyn.get("autoseek"));
				this.next("PlayVideo");
			}, this);
			if (this.dyn.get("skipinitial") && !this.dyn.get("autoplay"))
				this.next("PlayVideo");
			else
				this.dyn.player.play();
		}
	
	});
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.ErrorVideo", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["message"],

		_started: function () {
			this.dyn.set("message", this.dyn.string("video-error"));
			this.listenOn(this.dyn, "message:click", function () {
				this.next("LoadVideo");
			}, this);
		}
	
	});
});




Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.PlayVideo", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["controlbar"],

		_started: function () {
			this.dyn.set("autoplay", false);
			this.listenOn(this.dyn, "change:currentstream", function () {
				this.dyn.set("autoplay", true);
				this.dyn.set("autoseek", this.dyn.player.position());
				this.dyn.reattachVideo();
				this.next("LoadPlayer");
			}, this);
			this.listenOn(this.dyn, "ended", function () {
				this.dyn.set("autoseek", null);
				this.next("NextVideo");
			}, this);
			this.listenOn(this.dyn, "change:buffering", function () {
				this.dyn.set("loader_active", this.dyn.get("buffering"));
			}, this);
			this.listenOn(this.dyn, "error:video", function () {
				this.next("ErrorVideo");
			}, this);
		},
		
		play: function () {
			if (!this.dyn.get("playing"))
				this.dyn.player.play();
		}

	});
});


Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.NextVideo", [
	"module:VideoPlayer.Dynamics.PlayerStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {

		_started: function () {
			if (this.dyn.get("playlist")) {
				var list = this.dyn.get("playlist");
				var head = list.shift();
				if (this.dyn.get("loop"))
					list.push(head);
				this.dyn.set("playlist", list);
				if (list.length > 0) {
					var pl0 = list[0];
					this.dyn.set("poster", pl0.poster);
					this.dyn.set("source", pl0.source);
					this.dyn.set("sources", pl0.sources);
					this.dyn.reattachVideo();
					this.dyn.set("autoplay", true);
					this.next("LoadPlayer");
					return;
				}
			}
			this.next("PosterReady");
		}

	});
});


Scoped.define("module:VideoPlayer.Dynamics.Topmessage", [
    "dynamics:Dynamic",
    "module:Templates"
], function (Class, Templates, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_player_topmessage,
			
			attrs: {
				"css": "ba-videoplayer",
				"topmessage": ''
			}
			
		};
	}).register("ba-videoplayer-topmessage");
});



/*
Scoped.define("module:VideoPlayer.Dynamics.Topmessage", [
	"dynamics:Dynamic",
	"jquery:",
	"module:Templates",
	"module:Assets",
	"browser:Info"
], [
	"dynamics:Partials.StylesPartial",
	"dynamics:Partials.ShowPartial",
	"dynamics:Partials.IfPartial",
	"dynamics:Partials.ClickPartial"
], function (Class, $, Templates, Assets, Info, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			template: Templates.video_player_topmessage,

			attrs: {
				"css": "ba-videoplayer",
				"volume": 1.0,
				"fullscreen": true,
				"topmessage": ''
			},

			functions: {

				share_media: function() {},

				toggle_fullscreen: function () {
					this.trigger("fullscreen");
				},

				startUpdateVolume: function (event) {
					event[0].preventDefault();
					this.set("_updateVolume", true);
					this.call("progressUpdateVolume", event);
				},

				progressUpdateVolume: function (event) {
					event[0].preventDefault();
					if (!this.get("_updateVolume"))
						return;
					this.set("volume", (event[0].clientX - $(event[0].currentTarget).offset().left) / $(event[0].currentTarget).width());
					this.trigger("volume", this.get("volume"));
				},

				stopUpdateVolume: function (event) {
					event[0].preventDefault();
					this.set("_updateVolume", false);
				},

				toggle_volume: function () {
					if (this.get("volume") > 0) {
						this.__oldVolume = this.get("volume");
						this.set("volume", 0);
					} else
						this.set("volume", this.__oldVolume || 1);
					this.trigger("volume", this.get("volume"));
				}
			}

		};
	}).register("ba-videoplayer-topmessage")
		.attachStringTable(Assets.strings)
		.addStrings({
			"volume-button": "Set volume",
			"fullscreen-video": "Enter fullscreen",
			"volume-mute": "Mute sound",
			"volume-unmute": "Unmute sound",
			"share-media": "Share this media"
		});
});
*/
Scoped.define("module:VideoRecorder.Dynamics.Chooser", [
    "dynamics:Dynamic",
    "module:Templates",
    "module:Assets",
    "browser:Info"
], [
    "dynamics:Partials.ClickPartial",
    "dynamics:Partials.IfPartial"
], function (Class, Templates, Assets, Info, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_recorder_chooser,
			
			attrs: {
				"css": "ba-videorecorder",
				"allowrecord": true,
				"allowupload": true,
				"allowcustomupload": true,
				"primaryrecord": true
			},
			
			create: function () {
				this.set("has_primary", true);
				this.set("enable_primary_select", false);
				this.set("primary_label", this.string(this.get("primaryrecord") && this.get("allowrecord") ? "record-video" : "upload-video"));
				this.set("secondary_label", this.string(this.get("primaryrecord") ? "upload-video" : "record-video"));
				if (!this.get("allowrecord") || !this.get("primaryrecord") || (Info.isMobile() && (!Info.isAndroid() || !Info.isCordova()))) {
					this.set("enable_primary_select", true);
					this.set("primary_select_capture", Info.isMobile() && this.get("allowrecord") && this.get("primaryrecord"));
					this.set("primary_accept_string", Info.isMobile() && this.get("allowrecord") && this.get("primaryrecord") ? "video/*,video/mp4;capture=camcorder" : (Info.isMobile() || !this.get("allowcustomupload") ? "video/*,video/mp4" : ""));
				}
				this.set("has_secondary", this.get("allowrecord") && this.get("allowupload"));
				this.set("enable_secondary_select", false);
				if (this.get("primaryrecord") || (Info.isMobile() && (!Info.isAndroid() || !Info.isCordova()))) {
					this.set("enable_secondary_select", true);
					this.set("secondary_select_capture", Info.isMobile() && !this.get("primaryrecord"));
					this.set("secondary_accept_string", Info.isMobile() && !this.get("primaryrecord") ? "video/*,video/mp4;capture=camcorder" : (Info.isMobile() || !this.get("allowcustomupload") ? "video/*,video/mp4" : ""));
				}
			},
			
			__recordCordova: function () {
				var self = this;
				navigator.device.capture.captureVideo(function (mediaFiles) {
				    var mediaFile = mediaFiles[0];
				    self.trigger("upload", mediaFile);
				}, function (error) {}, {limit:1});
			},
			
			functions: {
				primary: function () {
					if (this.get("enable_primary_select"))
						return;
					if (Info.isMobile() && Info.isAndroid() && Info.isCordova())
						this.__recordCordova();
					else
						this.trigger("record");
				},
				secondary: function () {
					if (this.get("enable_secondary_select"))
						return;
					if (Info.isMobile() && Info.isAndroid() && Info.isCordova())
						this.__recordCordova();
					else
						this.trigger("record");
				},
				primary_select: function (domEvent) {
					if (!this.get("enable_primary_select"))
						return;
					this.trigger("upload", domEvent[0].target);
				},
				secondary_select: function (domEvent) {
					if (!this.get("enable_secondary_select"))
						return;
					this.trigger("upload", domEvent[0].target);
				}
			}
			
		};
	}).register("ba-videorecorder-chooser")
	.attachStringTable(Assets.strings)
    .addStrings({
    	"record-video": "Record Your Video",
    	"upload-video": "Upload Video"
    });
});

Scoped.define("module:VideoRecorder.Dynamics.Controlbar", [
    "dynamics:Dynamic",
    "module:Templates",
    "module:Assets",
    "base:Timers.Timer"
], [
	"dynamics:Partials.ShowPartial",
	"dynamics:Partials.RepeatPartial"	
], function (Class, Templates, Assets, Timer, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_recorder_controlbar,
			
			attrs: {
				"css": "ba-videorecorder",
				"hovermessage": "",
				"recordingindication": true,
				"covershot_accept_string":  "image/*,image/png,image/jpg,image/jpeg"
			},
			
			create: function () {
				this.auto_destroy(new Timer({
					context: this,
					fire: function () {
						this.set("recordingindication", !this.get("recordingindication"));
					},
					delay: 500
				}));
			},
			
			functions: {
				selectCamera: function (cameraId) {
					this.trigger("select-camera", cameraId);
				},
				selectMicrophone: function (microphoneId) {
					this.trigger("select-microphone", microphoneId);
				},
				hover: function (text) {
					this.set("hovermessage", text);
				},
				unhover: function () {
					this.set("hovermessage", "");
				},
				record: function () {
					this.trigger("invoke-record");
				},
				rerecord: function () {
					this.trigger("invoke-rerecord");
				},
				stop: function () {
					this.trigger("invoke-stop");
				},
				skip: function () {
					this.trigger("invoke-skip");
				},
				uploadCovershot: function (domEvent) {
					this.trigger("upload-covershot", domEvent[0].target);
				}
			}
			
		};
	})
	.register("ba-videorecorder-controlbar")
	.attachStringTable(Assets.strings)
    .addStrings({
    	"settings": "Settings",
    	"camerahealthy": "Lighting is good",
    	"cameraunhealthy": "Lighting is not optimal",
    	"microphonehealthy": "Sound is good",
    	"microphoneunhealthy": "Cannot pick up any sound",
    	"record": "Record",
    	"record-tooltip": "Click here to record.",
    	"rerecord": "Redo",
    	"rerecord-tooltip": "Click here to redo.",
    	"upload-covershot": "Upload",
    	"upload-covershot-tooltip": "Click here to upload custom cover shot",
    	"stop": "Stop",
    	"stop-tooltip": "Click here to stop.",
    	"skip": "Skip",
    	"skip-tooltip": "Click here to skip."
    });
});
Scoped.define("module:VideoRecorder.Dynamics.Imagegallery", [
    "dynamics:Dynamic",
    "module:Templates",
    "base:Collections.Collection",
    "base:Properties.Properties",
    "jquery:",
    "base:Timers.Timer"
], [
    "dynamics:Partials.StylesPartial"
], function (Class, Templates, Collection, Properties, $, Timer, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_recorder_imagegallery,
			
			attrs: {
				"css": "ba-videorecorder",
				"imagecount": 3,
				"imagenativewidth": 0,
				"imagenativeheight": 0,
				"containerwidth": 0,
				"containerheight": 0,
				"containeroffset": 0,
				"deltafrac": 1/8
			},
			
			computed: {
				"imagewidth:imagecount,containerwidth,deltafrac": function () {
					if (this.get("imagecount") <= 0)
						return 0.0;
					return this.get("containerwidth") * (1 - this.get("deltafrac")) / this.get("imagecount");
				},
				"imagedelta:imagecount,containerwidth,deltafrac": function () {
					if (this.get("imagecount") <= 1)
						return 0.0;
					return this.get("containerwidth") * (this.get("deltafrac")) / (this.get("imagecount") - 1);
				},
				"imageheight:imagewidth,imagenativewidth,imagenativeheight": function () {
					return this.get("imagenativeheight") * this.get("imagewidth") / this.get("imagenativewidth");
				}
			},
			
			create: function () {
				var images = this.auto_destroy(new Collection());
				this.set("images", images);
				this.snapshotindex = 0;
				this._updateImageCount();
				this.on("change:imagecount", this._updateImageCount, this);
				this.on("change:imagewidth change:imageheight change:imagedelta", this._recomputeImageBoxes, this);
				this.auto_destroy(new Timer({
					context: this,
					delay: 1000,
					fire: function () {
						this.updateContainerSize();
					}
				}));
			},
			
			destroy: function () {
				this.get("images").iterate(function (image) {
					if (image.snapshotDisplay && this.parent().recorder)
						this.parent().recorder.removeSnapshotDisplay(image.snapshotDisplay);
				}, this);
				inherited.destroy.call(this);
			},
			
			_updateImageCount: function () {
				var images = this.get("images");
				var n = this.get("imagecount");
				while (images.count() < n) {
					var image = new Properties({index: images.count()});
					this._recomputeImageBox(image);
					images.add(image);
				}
				while (images.count() > n)
					images.remove(images.getByIndex(images.count() - 1));
			},
			
			_recomputeImageBoxes: function () {
				this.get("images").iterate(function (image) {
					this._recomputeImageBox(image);
				}, this);
			},
			
			_recomputeImageBox: function (image) {
				if (!this.parent().recorder)
					return;
				var i = image.get("index");
				var iw = this.get("imagewidth");
				var ih = this.get("imageheight");
				var id = this.get("imagedelta");
				var h = this.get("containerheight");
				image.set("left", 1+Math.round(i * (iw + id)));
				image.set("top", 1+Math.round((h - ih) / 2));
				image.set("width", 1+Math.round(iw));
				image.set("height", 1+Math.round(ih));
				if (image.snapshot && image.snapshotDisplay) {
					this.parent().recorder.updateSnapshotDisplay(
						image.snapshot,
						image.snapshotDisplay,
						image.get("left") + this.get("containeroffset"),
						image.get("top"),
						image.get("width"),
						image.get("height")
					);
				}
			},
			
			updateContainerSize: function () {
				var container = this.activeElement().find("[data-gallery-container]");
				this.set("containeroffset", parseInt(container.position().left, 10));
				this.set("containerheight", parseInt(container.height(), 10));
				this.set("containerwidth", parseInt(container.width(), 10));
			},
			
			_afterActivate: function (element) {
				inherited._afterActivate.apply(this, arguments);
				this.updateContainerSize();
			},
			
			loadImageSnapshot: function (image, snapshotindex) {
				if (image.snapshotDisplay) {
					this.parent().recorder.removeSnapshotDisplay(image.snapshotDisplay);
					image.snapshotDisplay = null;
				}
				var snapshots = this.parent().snapshots;
				image.snapshot = snapshots[((snapshotindex % snapshots.length) + snapshots.length) % snapshots.length]; 
				image.snapshotDisplay = this.parent().recorder.createSnapshotDisplay(
					this.activeElement().get(0),
					image.snapshot,
					image.get("left") + this.get("containeroffset"),
					image.get("top"),
					image.get("width"),
					image.get("height")
				);
			},
			
			loadSnapshots: function () {
				this.get("images").iterate(function (image) {
					this.loadImageSnapshot(image, this.snapshotindex + image.get("index"));
				}, this);
			},
			
			nextSnapshots: function () {
				this.snapshotindex += this.get("imagecount");
				this.loadSnapshots();
			},
			
			prevSnapshots: function () {
				this.snapshotindex -= this.get("imagecount");
				this.loadSnapshots();
			},
			
			functions: {
				left: function () {
					this.prevSnapshots();
				},
				right: function () {
					this.nextSnapshots();
				},
				select: function (image) {
					this.trigger("image-selected", image.snapshot);
				}
			}
			
		};
	}).register("ba-videorecorder-imagegallery");
});
Scoped.define("module:VideoRecorder.Dynamics.Loader", [
    "dynamics:Dynamic",
    "module:Templates"
], [
	"dynamics:Partials.ShowPartial"
], function (Class, Templates, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_recorder_loader,
			
			attrs: {
				"css": "ba-videorecorder",
				"tooltip": "",
				"label": "",
				"message": ""
			}
			
		};
	}).register("ba-videorecorder-loader");
});
Scoped.define("module:VideoRecorder.Dynamics.Message", [
    "dynamics:Dynamic",
    "module:Templates"
], [
    "dynamics:Partials.ClickPartial"
], function (Class, Templates, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_recorder_message,
			
			attrs: {
				"css": "ba-videorecorder",
				"message": ''
			},
			
			functions: {
				
				click: function () {
					this.trigger("click");
				}
				
			}
			
		};
	}).register("ba-videorecorder-message");
});

Scoped.define("module:VideoRecorder.Dynamics.Recorder", [
    "dynamics:Dynamic",
    "module:Templates",
    "module:Assets",
    "browser:Info",
    "browser:Upload.MultiUploader",
    "browser:Upload.FileUploader",
    "media:Recorder.VideoRecorderWrapper",
    "base:Types",
    "base:Objs",
    "base:Strings",
    "base:Time",
    "base:Timers",
    "base:States.Host",
    "base:Classes.ClassRegistry",
    "base:Collections.Collection",
    "base:Promise",
    "module:VideoRecorder.Dynamics.RecorderStates.Initial",
    "module:VideoRecorder.Dynamics.RecorderStates"
], [
    "module:VideoRecorder.Dynamics.Imagegallery",
    "module:VideoRecorder.Dynamics.Loader",
    "module:VideoRecorder.Dynamics.Controlbar",
    "module:VideoRecorder.Dynamics.Message",
    "module:VideoRecorder.Dynamics.Topmessage",
    "module:VideoRecorder.Dynamics.Chooser",
    "dynamics:Partials.ShowPartial",
    "dynamics:Partials.IfPartial",
    "dynamics:Partials.EventPartial",
    "dynamics:Partials.OnPartial",
    "dynamics:Partials.DataPartial",
    "dynamics:Partials.AttrsPartial",
    "dynamics:Partials.TemplatePartial"
], function (Class, Templates, Assets, Info, MultiUploader, FileUploader, VideoRecorderWrapper, Types, Objs, Strings, Time, Timers, Host, ClassRegistry, Collection, Promise, InitialState, RecorderStates, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.recorder,
			
			attrs: {
				/* CSS */
				"css": "ba-videorecorder",
				"iecss": "ba-videorecorder",
				"cssimagegallery": "",
				"cssloader": "",
				"csscontrolbar": "",
				"cssmessage": "",
				"csstopmessage": "",
				"csschooser": "",
				"width": "",
				"height": "",
				"gallerysnapshots": 3,
				/* Themes */
				"theme": "",
				"csstheme": "",
				/* Dynamics */
				"dynimagegallery": "videorecorder-imagegallery",
				"dynloader": "videorecorder-loader",
				"dyncontrolbar": "videorecorder-controlbar",
				"dynmessage": "videorecorder-message",
				"dyntopmessage": "videorecorder-topmessage",
				"dynchooser": "videorecorder-chooser",
				"dynvideoplayer": "videoplayer",
				/* Templates */
				"tmplimagegallery": "",
				"tmplloader": "",
				"tmplcontrolbar": "",
				"tmplmessage": "",
				"tmpltopmessage": "",
				"tmplchooser": "",
				/* Attributes */
				"autorecord": false,
				"autoplay": false,
				"allowrecord": true,
				"allowupload": true,
				"allowcustomupload": true,
				"primaryrecord": true,
				"nofullscreen": false,
				"recordingwidth": 640,
				"recordingheight": 480,
				"countdown": 3,
				"snapshotmax": 15,
				"framerate": null,
				"snapshottype": "jpg",
				"picksnapshots": true,
				"playbacksource": "",
				"playbackposter": "",
				"recordermode": true,
				"skipinitial": false,
				"timelimit": null,
				"timeminlimit": null,
				"rtmpstreamtype": "mp4",
				"rtmpmicrophonecodec": "speex",
				"microphone-volume": 1.0,
				"flip-camera": false,
				"early-rerecord": false,
				"custom-covershots": false,
				"manualsubmit": false,
				"allowedextensions": null,
				"filesizelimit": null,
				/* Configuration */
				"forceflash": false,
				"simulate": false,
				"noflash": false,
				"noaudio": false,
				"flashincognitosupport": false,
				"localplayback": false,
				"uploadoptions": {},
				"playerattrs": {},
				/* Options */
				"rerecordable": true,
				"recordings": null,
				"ready": true,
				"stretch": false
			},
			
			scopes: {
				player: ">[id='player']"
			},

			types: {
				"forceflash": "boolean",
				"noflash": "boolean",
				"rerecordable": "boolean",
				"ready": "boolean",
				"stretch": "boolean",
				"autorecord": "boolean",
				"autoplay": "boolean",
				"allowrecord": "boolean",
				"allowupload": "boolean",
				"allowcustomupload": "boolean",
				"primaryrecord": "boolean",
				"flashincognitosupport": "boolean",
				"recordermode": "boolean",
				"nofullscreen": "boolean",
				"picksnapshots": "boolean",
				"localplayback": "boolean",
				"noaudio": "boolean",
				"skipinitial": "boolean",
				"microphone-volume": "float",
				"flip-camera": "boolean",
				"early-rerecord": "boolean",
				"custom-covershots": "boolean",
				"manualsubmit": "boolean",
				"simulate": "boolean"
			},
			
			extendables: ["states"],
			
			remove_on_destroy: true,
			
			create: function () {
				
				if (this.get("theme") in Assets.recorderthemes) {
					Objs.iter(Assets.recorderthemes[this.get("theme")], function (value, key) {
						if (!this.isArgumentAttr(key))
							this.set(key, value);
					}, this);
				}
				this.set("ie8", Info.isInternetExplorer() && Info.internetExplorerVersion() < 9);
				this.set("hideoverlay", false);
				
				if (Info.isMobile())
					this.set("skipinitial", false);

				this.__attachRequested = false;
				this.__activated = false;
				this._bound = false;
				this.__recording = false;
				this.__error = null;
				this.__currentStretch = null;
				
				this.on("change:stretch", function () {
					this._updateStretch();
				}, this);
				this.host = new Host({
					stateRegistry: new ClassRegistry(this.cls.recorderStates())
				});
				this.host.dynamic = this;
				this.host.initialize(InitialState);
				
				this._timer = new Timers.Timer({
					context: this,
					fire: this._timerFire,
					delay: 250,
					start: true
				});
				
				this.__cameraResponsive = true;
				this.__cameraSignal = true;
				
			},
			
			state: function () {
				return this.host.state();
			},
			
			recorderAttached: function () {
				return !!this.recorder;
			},
			
			videoError: function () {
				return this.__error;
			},
			
			_error: function (error_type, error_code) {
				this.__error = {
					error_type: error_type,
					error_code: error_code
				};
				this.trigger("error:" + error_type, error_code);
				this.trigger("error", error_type, error_code);
			},
			
			_clearError: function () {
				this.__error = null;
			},
			
			_detachRecorder: function () {
				if (this.recorder)
					this.recorder.weakDestroy();
				this.recorder = null;
				this.set("hasrecorder", false);
			},
			
			_attachRecorder: function () {
				if (this.recorderAttached())
					return;
				if (!this.__activated) {
					this.__attachRequested = true;
					return;
				}
				this.set("hasrecorder", true);
				this.snapshots = [];
				this.__attachRequested = false;
				var video = this.element().find("[data-video='video']").get(0);
				this._clearError();
				this.recorder = VideoRecorderWrapper.create({
					element: video,
					simulate: this.get("simulate"),
			    	forceflash: this.get("forceflash"),
			    	noflash: this.get("noflash"),
			    	recordVideo: true,
			    	recordAudio: !this.get("noaudio"),
			    	recordingWidth: this.get("recordingwidth"),
			    	recordingHeight: this.get("recordingheight"),
			    	flashFullSecurityDialog: !this.get("flashincognitosupport"),
			    	rtmpStreamType: this.get("rtmpstreamtype"),
			    	rtmpMicrophoneCodec: this.get("rtmpmicrophonecodec"),
			    	framerate: this.get("framerate"),
			    	flip: this.get("flip-camera")
			    });
				if (!this.recorder)
					this._error("attach");
			},
			
			_bindMedia: function () {
				if (this._bound || !this.recorderAttached() || !this.recorder)
					return;
				this.recorder.ready.success(function () {
					this.recorder.on("require_display", function () {
						this.set("hideoverlay", true);
					}, this);
					this.recorder.bindMedia().error(function (e) {
						this.trigger("access_forbidden", e);
						this.set("hideoverlay", false);
						this.off("require_display", null, this);
						this._error("bind", e);
					}, this).success(function () {
						this.trigger("access_granted");
						this.recorder.setVolumeGain(this.get("microphone-volume"));
						this.set("hideoverlay", false);
						this.off("require_display", null, this);
						this.recorder.enumerateDevices().success(function (devices) {
							var selected = this.recorder.currentDevices();
							this.set("selectedcamera", selected.video);
							this.set("selectedmicrophone", selected.audio);
							this.set("cameras", new Collection(Objs.values(devices.video)));
							this.set("microphones", new Collection(Objs.values(devices.audio)));
						}, this);
						if (!this.get("noaudio"))
							this.recorder.testSoundLevel(true);
						this.set("devicetesting", true);
						this._updateStretch();
						while (this.snapshots.length > 0) {
							var snapshot = this.snapshots.unshift();
							this.recorder.removeSnapshot(snapshot);
						}
						this._bound = true;
						this.trigger("bound");
					}, this);
				}, this);
			},
			
			isFlash: function () {
				return this.recorder && this.recorder.isFlash();
			},
			
			_initializeUploader: function () {
				if (this._dataUploader)
					this._dataUploader.weakDestroy();
				this._dataUploader = new MultiUploader();
			},
			
			_unbindMedia: function () {
				if (!this._bound)
					return;
				this.recorder.unbindMedia();
				this._bound = false;
			},
			
			_uploadCovershot: function (image) {
				if (this.get("simulate"))
					return;
				this.__lastCovershotUpload = image;
				var uploader = this.recorder.createSnapshotUploader(image, this.get("snapshottype"), this.get("uploadoptions").image);
				uploader.upload();
				this._dataUploader.addUploader(uploader);
			},
			
			_uploadCovershotFile: function (file) {
				if (this.get("simulate"))
					return;
				this.__lastCovershotUpload = file;
				var uploader = FileUploader.create(Objs.extend({ source: file }, this.get("uploadoptions").image));
				uploader.upload();
				this._dataUploader.addUploader(uploader);
			},

			_uploadVideoFile: function (file) {
				if (this.get("simulate"))
					return;
				var uploader = FileUploader.create(Objs.extend({ source: file }, this.get("uploadoptions").video));
				uploader.upload();
				this._dataUploader.addUploader(uploader);
			},
			
			_prepareRecording: function () {
				return Promise.create(true);
			},
			
			_startRecording: function () {
				if (this.__recording)
					return Promise.error(true);
				if (!this.get("noaudio"))
					this.recorder.testSoundLevel(false);
				this.set("devicetesting", false);
				return this.recorder.startRecord({
					rtmp: this.get("uploadoptions").rtmp,
					video: this.get("uploadoptions").video,
					audio: this.get("uploadoptions").audio
				}).success(function () {
					this.__recording = true;
					this.__recording_start_time = Time.now();
				}, this);
			},
			
			_stopRecording: function () {
				if (!this.__recording)
					return Promise.error(true);
				return this.recorder.stopRecord({
					rtmp: this.get("uploadoptions").rtmp,
					video: this.get("uploadoptions").video,
					audio: this.get("uploadoptions").audio
				}).success(function (uploader) {
					this.__recording = false;
					uploader.upload();
					this._dataUploader.addUploader(uploader);
				}, this);
			},
			
			_verifyRecording: function () {
				return Promise.create(true);
			},
			
			_afterActivate: function (element) {
				inherited._afterActivate.call(this, element);
				this.__activated = true;
				if (this.__attachRequested)
					this._attachRecorder();
			},
			
			_showBackgroundSnapshot: function () {
				this._hideBackgroundSnapshot();
				this.__backgroundSnapshot = this.recorder.createSnapshot(this.get("snapshottype"));
				var el = this.activeElement().find("[data-video]");
				this.__backgroundSnapshotDisplay = this.recorder.createSnapshotDisplay(
					el.get(0),
					this.__backgroundSnapshot,
					0,
					0,
					parseInt(el.width(), 10),
					parseInt(el.height(), 10)
				);
			},
			
			_hideBackgroundSnapshot: function () {
				if (this.__backgroundSnapshotDisplay)
					this.recorder.removeSnapshotDisplay(this.__backgroundSnapshotDisplay);
				delete this.__backgroundSnapshotDisplay;
				if (this.__backgroundSnapshot)
					this.recorder.removeSnapshot(this.__backgroundSnapshot);
				delete this.__backgroundSnapshot;
			},
			
			object_functions: ["record", "rerecord", "stop", "play", "pause", "reset"],

			functions: {
				
				record: function () {
					this.host.state().record();
				},
				
				record_video: function () {
					this.host.state().selectRecord();
				},
				
				upload_video: function (file) {
					this.host.state().selectUpload(file);
				},
				
				upload_covershot: function (file) {
					this.host.state().uploadCovershot(file);
				},

				select_camera: function (camera_id) {
					if (this.recorder) {
						this.recorder.setCurrentDevices({video: camera_id});
						this.set("selectedcamera", camera_id);
					}
				},
				
				select_microphone: function (microphone_id) {
					if (this.recorder) {
						this.recorder.setCurrentDevices({audio: microphone_id});
						this.recorder.testSoundLevel(true);
						this.set("selectedmicrophone", microphone_id);
					}
					this.set("microphonehealthy", false);
				},
				
				invoke_skip: function () {
					this.trigger("invoke-skip");
				},
				
				select_image: function (image) {
					this.trigger("select-image", image);
				},
				
				rerecord: function () {
					if (confirm(this.string("rerecord-confirm")))
						this.host.state().rerecord();
				},
				
				stop: function () {
					this.host.state().stop();
				},
				
				play: function () {
					this.host.state().play();
				},

				pause: function () {
					this.host.state().pause();
				},
				
				message_click: function () {
					this.trigger("message-click");
				},
				
				playing: function () {
					this.trigger("playing");
				},
				
				paused: function () {
					this.trigger("paused");
				},
				
				ended: function () {
					this.trigger("ended");
				},
				
				reset: function () {
					this._stopRecording().callback(function () {
						this._detachRecorder();
						this.host.state().next("Initial");
					}, this);
				},
				
				manual_submit: function () {
					this.set("rerecordable", false);
					this.set("manualsubmit", false);
					this.trigger("manually_submitted");
				}
						
			},
			
			destroy: function () {				
				this._timer.destroy();
				this.host.destroy();
				this._detachRecorder();
				inherited.destroy.call(this);
			},
			
			deltaCoefficient: function () {
				return this.recorderAttached() ? this.recorder.deltaCoefficient() : null;
			},

			blankLevel: function () {
				return this.recorderAttached() ? this.recorder.blankLevel() : null;
			},

			lightLevel: function () {
				return this.recorderAttached() ? this.recorder.lightLevel() : null;
			},
			
			soundLevel: function () {
				return this.recorderAttached() ? this.recorder.soundLevel() : null;
			},
			
			_timerFire: function () {
				try {
					if (this.recorderAttached() && this.get("devicetesting")) {
						var lightLevel = this.lightLevel();
						this.set("camerahealthy", lightLevel >= 100 && lightLevel <= 200);
						if (!this.get("noaudio") && !this.get("microphonehealthy") && this.soundLevel() >= 1.01) {
							this.set("microphonehealthy", true);
							this.recorder.testSoundLevel(false);
						}
					}
				} catch (e) {}
				
				if (this.__recording && this.__recording_start_time + 500 < Time.now()) {
					var p = this.snapshots.length < this.get("snapshotmax") ? 0.25 : 0.05;
					if (Math.random() <= p) {
						var snap = this.recorder.createSnapshot(this.get("snapshottype"));
						if (snap) {
							if (this.snapshots.length < this.get("snapshotmax")) {
								this.snapshots.push(snap);
							} else {
								var i = Math.floor(Math.random() * this.get("snapshotmax"));
								this.recorder.removeSnapshot(this.snapshots[i]);
								this.snapshots[i] = snap;
							}
						}
					}
				}
				
				try {
					if (this.recorderAttached() && this._timer.fire_count() % 20 === 0 && this._accessing_camera) {
						var signal = this.blankLevel() >= 0.01;
						if (signal !== this.__cameraSignal) {
							this.__cameraSignal = signal;
							this.trigger(signal ? "camera_signal" : "camera_nosignal");
						}
					}
					if (this.recorderAttached() && this._timer.fire_count() % 20 === 10 && this._accessing_camera) {
						var delta = this.recorder.deltaCoefficient(); 
						var responsive = delta === null || delta >= 0.5;
						if (responsive !== this.__cameraResponsive) {
							this.__cameraResponsive = responsive;
							this.trigger(responsive ? "camera_responsive" : "camera_unresponsive");
						}
					}
				} catch (e) {}
				
				this._updateStretch();
				this._updateCSSSize();
			},
			
			_updateCSSSize: function () {
				this.set("csssize", this.element().width() > 400 ? "normal" : (this.element().width() > 300 ? "medium" : "small"));
			},
			
			videoHeight: function () {
				return this.recorderAttached() ? this.recorder.cameraHeight() : NaN;
			},
			
			videoWidth: function () {
				return this.recorderAttached() ? this.recorder.cameraWidth() : NaN;
			},
			
			aspectRatio: function () {
				return this.videoWidth() / this.videoHeight();
			},
			
			parentWidth: function () {
				return this.get("width") || this.activeElement().width();
			},
			
			parentHeight: function () {
				return this.get("height") || this.activeElement().height();
			},

			parentAspectRatio: function () {
				return this.parentWidth() / this.parentHeight();
			},
			
			averageFrameRate: function () {
				return this.recorderAttached() ? this.recorder.averageFrameRate() : null;
			},
			
			_updateStretch: function () {
				var newStretch = null;
				if (this.get("stretch")) {
					var ar = this.aspectRatio();
					if (isFinite(ar)) {
						var par = this.parentAspectRatio();
						if (isFinite(par)) {
							if (par > ar)
								newStretch = "height";
							if (par < ar)
								newStretch = "width";
						} else if (par === Infinity)
							newStretch = "height";
					}
				}
				if (this.__currentStretch !== newStretch) {
					if (this.__currentStretch)
						this.activeElement().removeClass(this.get("css") + "-stretch-" + this.__currentStretch);
					if (newStretch)
						this.activeElement().addClass(this.get("css") + "-stretch-" + newStretch);
				}
				this.__currentStretch = newStretch;				
			}
			
		};
	}, {
		
		recorderStates: function () {
			return [RecorderStates];
		}
		
	}).register("ba-videorecorder")
	.attachStringTable(Assets.strings)
    .addStrings({
    	"recorder-error": "An error occurred, please try again later. Click to retry.",
    	"attach-error": "We could not access the camera interface. Depending on the device and browser, you might need to install Flash or access the page via SSL.",
    	"access-forbidden": "Access to the camera was forbidden. Click to retry.",
    	"pick-covershot": "Pick a covershot.",
    	"uploading": "Uploading",
    	"uploading-failed": "Uploading failed - click here to retry.",
    	"verifying": "Verifying",
    	"verifying-failed": "Verifying failed - click here to retry.",
    	"rerecord-confirm": "Do you really want to redo your video?",
    	"video_file_too_large": "Your video file is too large - click here to try again with a smaller video file.",
    	"unsupported_video_type": "Please upload: %s - click here to retry."    		
    });
});
Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.State", [
    "base:States.State",
    "base:Events.ListenMixin",
    "base:Objs"
], function (State, ListenMixin, Objs, scoped) {
	return State.extend({scoped: scoped}, [ListenMixin, {

		dynamics: [],
	
		_start: function () {
			this.dyn = this.host.dynamic;
			Objs.iter(Objs.extend({
				"message": false,
				"chooser": false,
				"topmessage": false,
				"controlbar": false,
				"loader": false,
				"imagegallery": false
			}, Objs.objectify(this.dynamics)), function (value, key) {
				this.dyn.set(key + "_active", value);
			}, this);
			this.dyn.set("playertopmessage", "");
			this.dyn._accessing_camera = false;
			this._started();
		},
		
		_started: function () {},
		
		record: function () {
			this.dyn.set("autorecord", true);
		},
		
		stop: function () {
			this.dyn.scopes.player.execute('stop');
		},
		
		play: function () {
			this.dyn.scopes.player.execute('play');
		},
		
		pause: function () {
			this.dyn.scopes.player.execute('pause');
		},		
		
		rerecord: function () {},
		
		selectRecord: function () {},
		
		selectUpload: function (file) {},
		
		uploadCovershot: function (file) {}
	
	}]);
});



Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.FatalError", [
	"module:VideoRecorder.Dynamics.RecorderStates.State",
	"browser:Info",
	"base:Timers.Timer"
], function (State, Info, Timer, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["message"],
		_locals: ["message", "retry", "flashtest"],

		_started: function () {
			this.dyn.set("message", this._message || this.dyn.string("recorder-error"));
			this.listenOn(this.dyn, "message-click", function () {
				if (this._retry)
					this.next(this._retry);
			});
			if (this._flashtest && !Info.isMobile() && Info.flash().supported() && !Info.flash().installed()) {
				this.auto_destroy(new Timer({
					delay: 500,
					context: this,
					fire: function () {
						if (Info.flash(true).installed())
							this.next(this._retry);
					}
				}));
				if (Info.isSafari() && Info.safariVersion() >= 10)
					document.location.href = "//get.adobe.com/flashplayer";
			}
		}

	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Initial", [
    "module:VideoRecorder.Dynamics.RecorderStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, { 
		
		_started: function () {
			this.dyn.set("player_active", false);
			this.dyn._initializeUploader();
			if (!this.dyn.get("recordermode"))
				this.next("Player");
			else if (this.dyn.get("autorecord") || this.dyn.get("skipinitial"))
				this.eventualNext("CameraAccess");
			else
				this.next("Chooser");
		}
	
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Player", [
	"module:VideoRecorder.Dynamics.RecorderStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, { 
		
		rerecord: function () {
			this.dyn.trigger("rerecord");
			this.dyn.set("recordermode", true);
			this.next("Initial");
		},
		
		_started: function () {
			this.dyn.set("player_active", true);
		},
		
		_end: function () {
			this.dyn.set("player_active", false);
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Chooser", [
	"module:VideoRecorder.Dynamics.RecorderStates.State",
	"jquery:",
	"base:Strings",
	"browser:Info"
], function (State, $, Strings, Info, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["chooser"],
		
		record: function () {
			this.dyn.set("autorecord", true);
			this.selectRecord();
		},
		
		selectRecord: function () {
			this.next("CameraAccess");
		},
		
		selectUpload: function (file) {
			if (!(Info.isMobile() && Info.isAndroid() && Info.isCordova())) {
				if (this.dyn.get("allowedextensions")) {
					var filename = $(file).val().toLowerCase();
					var found = false;
					this.dyn.get("allowedextensions").forEach(function (extension) {
						if (Strings.ends_with(filename, "." + extension.toLowerCase()))
							found = true;
					}, this);
					if (!found) {
						this.next("FatalError", {
							message: this.dyn.strings("unsupported_video_type").replace("%s", this.dyn.get("allowedextensions").join(" / ")),
							retry: "Chooser"
						});
						return;
					}
				}
				if (this.dyn.get("filesizelimit")) {
					var f = file;
					if (f.files && f.files.length > 0 && f.files[0].size > this.dyn.get("filesizelimit")) {
						this.next("FatalError", {
							message: this.dyn.strings("video_file_too_large"),
							retry: "Chooser"
						});
						return;
					}
				}
			}
			this.dyn._prepareRecording().success(function () {
				this.dyn._uploadVideoFile(file);
				this.next("Uploading");
			}, this).error(function (s) {
				this.next("FatalError", { message: s, retry: "Chooser" });
			}, this);
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.CameraAccess", [
	"module:VideoRecorder.Dynamics.RecorderStates.State",
	"base:Timers.Timer"
], function (State, Timer, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["loader"],
		
		_started: function () {
			this.dyn.set("settingsvisible", true);
			this.dyn.set("recordvisible", true);
			this.dyn.set("rerecordvisible", false);
			this.dyn.set("stopvisible", false);
			this.dyn.set("skipvisible", false);
			this.dyn.set("controlbarlabel", "");
			this.listenOn(this.dyn, "bound", function () {
				var timer = this.auto_destroy(new Timer({
					start: true,
					delay: 100,
					context: this,
					fire: function () {
						if (this.dyn.recorder.blankLevel() >= 0.01 && this.dyn.recorder.deltaCoefficient() >= 0.01) {
							timer.stop();
							this.next("CameraHasAccess");
						}
					}
				}));
			}, this);
			this.listenOn(this.dyn, "error", function (s) {
				this.next("FatalError", { message: this.dyn.string("attach-error"), retry: "Initial", flashtest: true });
			}, this);
			this.listenOn(this.dyn, "access_forbidden", function () {
				this.next("FatalError", { message: this.dyn.string("access-forbidden"), retry: "Initial" });
			}, this);
			this.dyn._attachRecorder();
			if (this.dyn)
				this.dyn._bindMedia();
		}
				
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.CameraHasAccess", [
	"module:VideoRecorder.Dynamics.RecorderStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["topmessage", "controlbar"],
		
		_started: function () {
			this.dyn.set("settingsvisible", true);
			this.dyn.set("recordvisible", true);
			this.dyn.set("rerecordvisible", false);
			this.dyn.set("stopvisible", false);
			this.dyn.set("skipvisible", false);
			this.dyn.set("controlbarlabel", "");
			if (this.dyn.get("autorecord"))
				this.next("RecordPrepare");
		},
		
		record: function () {
			if (!this.dyn.get("autorecord"))
				this.next("RecordPrepare");
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.RecordPrepare", [
	"module:VideoRecorder.Dynamics.RecorderStates.State",
	"base:Timers.Timer",
	"base:Time"
], function (State, Timer, Time, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["loader"],
		
		_started: function () {
			this.dyn._accessing_camera = true;
			this._promise = this.dyn._prepareRecording();
			this.dyn.set("message", "");
			if (this.dyn.get("countdown")) {
				this.dyn.set("loaderlabel", this.dyn.get("countdown"));
				var endTime = Time.now() + this.dyn.get("countdown") * 1000;
				var timer = new Timer({
					context: this,
					delay: 100,
					fire: function () {
						var time_left = Math.max(0, endTime - Time.now());
						this.dyn.set("loaderlabel", "" + Math.round(time_left / 1000));
						this.dyn.trigger("countdown", time_left);
						if (endTime <= Time.now()) {
							this.dyn.set("loaderlabel", "");
							timer.stop();
							this._startRecording();
						}
					}
				});				
				this.auto_destroy(timer);
			} else
				this._startRecording();
		},
		
		record: function () {
			this._startRecording();
		},

		_startRecording: function () {
			this._promise.success(function () {
				this.dyn._startRecording().success(function () {
					this.next("Recording");
				}, this).error(function (s) {
					this.next("FatalError", { message: s, retry: "CameraAccess" });
				}, this);
			}, this).error(function (s) {
				this.next("FatalError", { message: s, retry: "CameraAccess" });
			}, this);
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Recording", [
	"module:VideoRecorder.Dynamics.RecorderStates.State",
	"base:Timers.Timer",
	"base:Time",
	"base:TimeFormat"
], function (State, Timer, Time, TimeFormat, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["topmessage", "controlbar"],
		
		_started: function () {
			this.dyn._accessing_camera = true;
			this.dyn.trigger("recording");
			this.dyn.set("settingsvisible", false);
			this.dyn.set("rerecordvisible", false);
			this.dyn.set("recordvisible", false);
			this.dyn.set("stopvisible", true);
			this.dyn.set("skipvisible", false);
			this._startTime = Time.now();
			this._stopping = false;
			this._timer = this.auto_destroy(new Timer({
				immediate: true,
				delay: 10,
				context: this,
				fire: this._timerFire
			}));
		},
		
		_timerFire: function () {
			var limit = this.dyn.get("timelimit");
			var current = Time.now();
			var display = Math.max(0, limit ? (this._startTime + limit * 1000 - current) : (current - this._startTime));
			this.dyn.set("controlbarlabel", TimeFormat.format(TimeFormat.ELAPSED_MINUTES_SECONDS, display));
			if (limit && this._startTime + limit * 1000 <= current) {
				this._timer.stop();
				this.stop();
			}
		},
		
		stop: function () {
			var minlimit = this.dyn.get("timeminlimit");
			if (minlimit) {
				var delta = Time.now() - this._startTime;
				if (delta < minlimit) {
					var limit = this.dyn.get("timelimit");
					if (!limit || limit > delta)
						return;
				}
			}
			if (this._stopping)
				return;
			this._stopping = true;
			this.dyn._stopRecording().success(function () {
				this.dyn._showBackgroundSnapshot();
				this.dyn._unbindMedia();
				this.dyn.trigger("recording_stopped");
				if (this.dyn.get("picksnapshots") && this.dyn.snapshots.length >= this.dyn.get("gallerysnapshots"))
					this.next("CovershotSelection");
				else
					this.next("Uploading");
			}, this).error(function (s) {
				this.next("FatalError", { message: s, retry: "CameraAccess" });
			}, this);
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.CovershotSelection", [
	"module:VideoRecorder.Dynamics.RecorderStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, {
		
		dynamics: ["imagegallery", "topmessage", "controlbar"],
		
		_started: function () {
			this.dyn.set("settingsvisible", false);
			this.dyn.set("recordvisible", false);
			this.dyn.set("stopvisible", false);
			this.dyn.set("skipvisible", true);
			this.dyn.set("controlbarlabel", "");
			this.dyn.set("rerecordvisible", this.dyn.get("early-rerecord"));
			this.dyn.set("uploadcovershotvisible", this.dyn.get("custom-covershots"));
			this.dyn.set("topmessage", this.dyn.string('pick-covershot'));
			var imagegallery = this.dyn.scope(">[tagname='ba-videorecorder-imagegallery']").materialize(true);
			imagegallery.loadSnapshots();
			imagegallery.updateContainerSize();
			this.listenOn(this.dyn, "invoke-skip", function () {
				this.next("Uploading");
			}, this);
			this.listenOn(this.dyn, "select-image", function (image) {
				this.dyn._uploadCovershot(image);
				this.next("Uploading");
			}, this);
		},
		
		rerecord: function () {
			this.dyn._hideBackgroundSnapshot();
			this.dyn._detachRecorder();
			this.dyn.trigger("rerecord");
			this.dyn.set("recordermode", true);
			this.next("Initial");
		},
		
		uploadCovershot: function (file) {
			this.dyn._uploadCovershotFile(file);
			this.next("Uploading");
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Uploading", [
	"module:VideoRecorder.Dynamics.RecorderStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, { 
		
		dynamics: ["loader", "message"],
		
		_started: function () {
			this.dyn.trigger("uploading");
			this.dyn.set("rerecordvisible", this.dyn.get("early-rerecord"));
			if (this.dyn.get("early-rerecord"))
				this.dyn.set("controlbar_active", true);
			this.dyn.set("topmessage", "");
			this.dyn.set("message", this.dyn.string("uploading"));
			this.dyn.set("playertopmessage", this.dyn.get("message"));
			var uploader = this.dyn._dataUploader;
			this.listenOn(uploader, "success", function () {
				this.dyn.trigger("uploaded");
				this.next("Verifying");
			});
			this.listenOn(uploader, "error", function () {
				this.dyn.set("player_active", false);
				this.next("FatalError", {
					message: this.dyn.string("uploading-failed"),
					retry: this.dyn.recorderAttached() ? "Uploading" : "Initial"
				});
			});
			this.listenOn(uploader, "progress", function (uploaded, total) {
				if (total !== 0) {
					this.dyn.trigger("upload_progress", uploaded / total);
					this.dyn.set("message", this.dyn.string("uploading") + ": " + Math.round(uploaded / total * 100) + "%");
					this.dyn.set("playertopmessage", this.dyn.get("message"));
				}
			});
			if (this.dyn.get("localplayback") && this.dyn.recorder && this.dyn.recorder.supportsLocalPlayback()) {
				this.dyn.set("playbacksource", this.dyn.recorder.localPlaybackSource());
				if (this.dyn.__lastCovershotUpload)
					this.dyn.set("playbackposter", this.dyn.recorder.snapshotToLocalPoster(this.dyn.__lastCovershotUpload));
				this.dyn.set("loader_active", false);
				this.dyn.set("message_active", false);
				this.dyn._hideBackgroundSnapshot();
				this.dyn.set("player_active", true);
			}
			uploader.reset();
			uploader.upload();
		},
		
		rerecord: function () {
			this.dyn._hideBackgroundSnapshot();
			this.dyn._detachRecorder();
			this.dyn.trigger("rerecord");
			this.dyn.set("recordermode", true);
			this.next("Initial");
		}
		
	});
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Verifying", [
	"module:VideoRecorder.Dynamics.RecorderStates.State"
], function (State, scoped) {
	return State.extend({scoped: scoped}, { 
		
		dynamics: ["loader", "message"],
		
		_started: function () {
			this.dyn.trigger("verifying");
			this.dyn.set("message", this.dyn.string("verifying") + "...");
			this.dyn.set("playertopmessage", this.dyn.get("message"));
			if (this.dyn.get("localplayback") && this.dyn.recorder && this.dyn.recorder.supportsLocalPlayback()) {
				this.dyn.set("loader_active", false);
				this.dyn.set("message_active", false);
			} else {
				this.dyn.set("rerecordvisible", this.dyn.get("early-rerecord"));
				if (this.dyn.get("early-rerecord"))
					this.dyn.set("controlbar_active", true);
			}
			this.dyn._verifyRecording().success(function () {
				this.dyn.trigger("verified");
				this.dyn._hideBackgroundSnapshot();
				this.dyn._detachRecorder();
				if (this.dyn.get("recordings"))
					this.dyn.set("recordings", this.dyn.get("recordings") - 1);
				this.next("Player");
			}, this).error(function () {
				this.dyn.set("player_active", false);
				this.next("FatalError", {
					message: this.dyn.string("verifying-failed"),
					retry: this.dyn.recorderAttached() ? "Verifying" : "Initial"
				});
			}, this);
		},
		
		rerecord: function () {
			this.dyn._hideBackgroundSnapshot();
			this.dyn._detachRecorder();
			this.dyn.trigger("rerecord");
			this.dyn.set("recordermode", true);
			this.next("Initial");
		}
		
	});
});
Scoped.define("module:VideoRecorder.Dynamics.Topmessage", [
    "dynamics:Dynamic",
    "module:Templates"
], function (Class, Templates, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			template: Templates.video_recorder_topmessage,
			
			attrs: {
				"css": "ba-videorecorder",
				"topmessage": ''
			}
			
		};
	}).register("ba-videorecorder-topmessage");
});
}).call(Scoped);