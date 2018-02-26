class EventListenerHandler {
    /*
    NOTE this is copied from Yjs and TODO maybe should be made more like Node streams interface or the one in PublicPrivate.js

    An event is a callback f({name, values})

    Add an event by e.g.  foo.eventHandler.addEventListener(f)
    Where: f({name, values}) => undefined

   Remove by foo.eventHandler.removeEventListener(f)

   Add to any class by adding field eventHandler = new EventListenerHandler()
     */
    constructor () {
        this.eventListeners = []
    }
    destroy () {
        this.eventListeners = null
    }
    /*
     Basic event listener boilerplate...
   */
    addEventListener (f) {
        this.eventListeners.push(f)
    }
    removeEventListener (f) {
        this.eventListeners = this.eventListeners.filter(function (g) {
            return f !== g
        })
    }
    removeAllEventListeners () {
        this.eventListeners = []
    }
    callEventListeners (event) {       // event = { dict, typically { type: 'insert', values: [x,y,z]}
        for (var i = 0; i < this.eventListeners.length; i++) {
            try {
                var _event = {}
                for (var name in event) {
                    _event[name] = event[name]  // Copies event to _event
                }
                this.eventListeners[i](_event)
            } catch (e) {
                console.error('Your observer threw an error. This error was caught so that Dweb still can ensure data consistency!', e)
            }
        }
    }
}

exports = module.exports = EventListenerHandler;