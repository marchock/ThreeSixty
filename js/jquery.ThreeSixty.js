/*global undefined */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {
    'use strict';
    // Create the defaults once
    var pluginName = "ThreeSixty",
        defaults = {
            propertyName: "value"
        },
        SWIPE_DIRECTION_ONE = "RIGHT_TO_LEFT", // if swiping left or right and the animation is animating in the oposite direction then
        SWIPE_DIRECTION_TWO = "LEFT_TO_RIGHT",
        ANIMATION_INCREASE_FRAME_RATE = 4,
        ANIMATION_REDUCE_FRAME_NUMBER = 10;

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        init: function () {

            this.onStart = false;

            // Apply all timers here
            this.timer = {
                animate: null,
                removeInactiveClass: null,
                createAnimationValues: null
            };


            this.setupEvents();
            this.setupFrameAnimation();

        },


        setupFrameAnimation: function (obj, delegate) {
            //this._delegate = delegate;
            this.animationControl = this.template();

            for (var name in obj) {
                this.animationControl[name] = obj[name];
            }

            this.frameSetUp(this.animationControl.startOnFrameNumber);
            this.skipSelectedAnimationFrames(false);  

            if (!this.animationControl.intro) {
                this.removeInactiveClass();
                this.introAnimationCompleted = true;   
            }     
        },


        template: function () {
            return {
                pixels: 48,
                numberOfFrames: 12,
                startOnFrameNumber: 1,
                skipFrameNumbers: [],
                lockPositions: [],
                animation: true,
                intro: {
                    direction: "LEFT_TO_RIGHT",
                    numberOfFramesToAnimate: 10,
                    animationFrameRate: 250
                }
            }   
        },


        handleEvent: function (e) {

            /* 
             * DESKTOP - e.clientX
             *
             * MOBILE - e.originalEvent.touches[0].clientX
             *
             * get x or y coordinates when user interacts with interface
             */
            var x = e.clientX || e.originalEvent.touches[0].clientX,
                y = e.clientY || e.originalEvent.touches[0].clientY;


            switch (e.type) {

            case this.START_EVENT:
                this.onStart = true;
                this.stopTimer = false;
                this.onTapDown(x);
                
            break; 

            case this.MOVE_EVENT:
                if (this.onStart) {
                    this.drag(x);
                }
                
            break;  

            case this.END_EVENT:
                this.onStart = false;
                this.stopTimer = true;
                this.onTapUp();
                
            break;  
            } 
        },


        onTapDown: function (x) {
            this.trackCoordinatesX = null;
            this.startPosX = x;
            this.posX = x;   

            if (this.animationControl.animation) {
                this.milliseconds = 0;
                this.createAnimationValues();
                clearTimeout(this.animationTimer); 
            }
            // this.triggerDelegateMethod("TAP_DOWN", this.frameNumber)  
            this.onTapPosition = x; 
        },

        drag: function (x) {
            this.directionX = this.posX >= x ? SWIPE_DIRECTION_ONE : SWIPE_DIRECTION_TWO;
            this.posX = x;

            if (this.directionX === "RIGHT_TO_LEFT") {
                this.startPosX = this.directionTracker !== "RIGHT_TO_LEFT" ? x : this.startPosX; // get new start X position when direction changes
                this.directionTracker = "RIGHT_TO_LEFT";
                this.dragRightToLeft(x);  
            }
            else {
                this.startPosX = this.directionTracker !== "LEFT_TO_RIGHT" ? x : this.startPosX; // get new start X position when direction changes
                this.directionTracker = "LEFT_TO_RIGHT";
                this.dragLeftToRight(x);  
            }  
        },

        onTapUp: function () {
            if (!this.animationControl.animation) {
                this.animate();
            }

            // If user does not drag then it is a tap
            // if (this.onTapPosition === this.posX) {
            //     this.triggerDelegateMethod("FRAME_NUMBER_ON_TAP", this.frameNumber);
            // }   
        },


        getCoordinatesX: function (x) {
            // get new or previous X coordinates
            this.trackCoordinatesX = !this.trackCoordinatesX ? Math.round(x / this.animationControl.pixels) : this.trackCoordinatesX;
            return this.trackCoordinatesX;   
        },

        dragRightToLeft: function (x) {
            if (this.getCoordinatesX(x) > Math.round(x / this.animationControl.pixels)) {
                this.nextFrame();
                this.trackCoordinatesX = Math.round(x / this.animationControl.pixels);
            }     
        },

        dragLeftToRight: function (x) {
            if (this.getCoordinatesX(x) < Math.round(x / this.animationControl.pixels)) {
                this.nextFrame();
                this.trackCoordinatesX = Math.round(x / this.animationControl.pixels);
            }  
        },

        nextFrame: function () {
            if (this.directionTracker === "RIGHT_TO_LEFT") {
                this.frameNumber = this.frameNumber < this.animationControl.numberOfFrames ? this.frameNumber += 1 : 1;

                if (this.animationControl.skipFrameNumbers[0] && this.skipSelectedFrames) {
                    this.frameNumber = this.frameNumber === this.animationControl.skipFrameNumbers[0] ? 20 : this.frameNumber;
                } 
            }
            else {
                this.frameNumber = this.frameNumber > 1 ? this.frameNumber -= 1 : this.animationControl.numberOfFrames;

                if (this.animationControl.skipFrameNumbers[1] && this.skipSelectedFrames) {
                    this.frameNumber = this.frameNumber === this.animationControl.skipFrameNumbers[1] ? 12 : this.frameNumber;
                }  
            }

            this.previousFrame = !this.previousFrame ? this.frameNumber : this.previousFrame;
            //this.triggerDelegateMethod("FRAME_NUMBER", this.frameNumber) 

            //this.imgElements[0].addClassName("car" + this.frameNumber);
            //this.imgElements[0].removeClassName("car" + this.previousFrame);
            $(".img-container").removeClass("car" + this.previousFrame);
            $(".img-container").addClass("car" + this.frameNumber);
            this.previousFrame = this.frameNumber;   
        },

        animate: function () {
            if (this.animationFrameNumber > 1) {
                this.nextFrame();
                this.timerControl("animate", this.animationFrameRate);
                this.animationFrameNumber -= 1;  
            }
            else {
                if (this.findLockPosition()) {
                    //this.triggerDelegateMethod("LAST_FRAME_NUMBER", this.frameNumber);

                    if (!this.introAnimationCompleted) {
                        this.introAnimationCompleted = true;
                        this.removeInactiveClass();    
                    }    
                }  
                else {
                    this.nextFrame();
                    this.timerControl("animate", 60);  
                } 
            } 
        },

        frameSetUp: function (num) {
            this.frameNumber = num;
            this.previousFrame = num;
            //this.imgElements = $(".img-container")//this.layer.querySelectorAll(".img-container");

            //console.log(this.imgElements)

            //$(this.imgElements[])

            $(".img-container").addClass("car" + num);

            //this.imgElements[0].className("car" + num);   
        },

        skipSelectedAnimationFrames: function (b) {
            if (this.animationControl.skipFrameNumbers[0]) {
                this.skipSelectedFrames = b;    
            } 
        },

        introAnimation: function () {
            this.introAnimationCompleted = false;
            this.directionTracker = this.animationControl.intro.direction;
            this.animationFrameRate = this.animationControl.intro.animationFrameRate;
            this.animationFrameNumber = this.animationControl.intro.numberOfFramesToAnimate;
            this.animate();
        },

        removeInactiveClass: function () {
            //this.layer.removeClassName("inactive");
            //adController.hideLoadingIndicator();
            //this.triggerDelegateMethod("INTRO_ANIMATION_COMPLETED", null); 
        },


        createAnimationValues: function () {
            if (!this.stopTimer) {
                this.timerControl("createAnimationValues", 10);
                this.milliseconds += 1;  
            }
            else {
                // applied to animate timer
                this.animationFrameRate = Math.abs(this.milliseconds / (this.startPosX-this.posX) * 1000);
                this.animationFrameRate = this.animationFrameRate * ANIMATION_INCREASE_FRAME_RATE;

                // Applied to animate() for loop
                this.animationFrameNumber = Math.round((this.startPosX-this.posX) / this.milliseconds);
                this.animationFrameNumber = Math.round(Math.abs(this.animationFrameNumber / ANIMATION_REDUCE_FRAME_NUMBER));
                this.animate();
            } 
        },

        findLockPosition: function () {
            if (this.animationControl.lockPositions.length) {

                for (var i = 0; i<this.animationControl.lockPositions.length; i += 1) {
                    if (this.animationControl.lockPositions[i] === this.frameNumber) {
                        return true;
                    } 
                } 
            } 
            else {
                return true; 
            } 
        },


        timerControl: function (methodName, delay) {
            //console.log("timer control: ", methodName, delay, this.timer)
            var that = this;
            clearTimeout(this.timer[methodName]);
            this.timer[methodName] = setTimeout(function () {
            that[methodName]();
            }, delay);   
        },


        /*
         * Set-up events on first load 
         */
        setupEvents: function () {
            var me = this,
                isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);


            this.START_EVENT = isMobile ? "touchstart" : "mousedown",
            this.MOVE_EVENT = isMobile ? "touchmove" : "mousemove",
            this.END_EVENT = isMobile ? "touchend" : "mouseup";


            /**
             * Event mouse down || touch start
             *
             */
            $(this.element).bind(this.START_EVENT, function (e) {
                me.handleEvent(e);
            });

            /**
             * Event mouse move || touch move
             *
             */
            $(this.element).bind(this.MOVE_EVENT, function (e) {
                me.handleEvent(e);
            });

            /**
             * Event mouse up || touch end
             *
             */
            $(this.element).bind(this.END_EVENT, function (e) {
                me.handleEvent(e);
            });


            /**
             * Event resize
             *
             */
            // $(window).resize(function() {
            //     me.resizeImage($(window).width());
            // });
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
            this.each(function() {
                    if ( !$.data( this, "plugin_" + pluginName ) ) {
                            $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
                    }
            });

            // chain jQuery functions
            return this;
    };

})( jQuery, window, document );







// iAd.Class({
//    name: "FrameAnimationController",
//    superclass: iAd.Control,
//    synthesizedProperties: ["delegate"],
//    cssClassName: "ad-frame-animation-control"
// });

// FrameAnimationController.FRAME_NUMBER = "frameAnimationAtIndex";
// FrameAnimationController.TAP_DOWN = "frameAnimationTapDown";
// FrameAnimationController.LAST_FRAME_NUMBER = "frameAnimationFinished";
// FrameAnimationController.FRAME_NUMBER_ON_TAP = "frameAnimationOnSelect";
// FrameAnimationController.INTRO_ANIMATION_COMPLETED = "frameAnimationIntroAnimationCompleted";

// FrameAnimationController.SWIPE_DIRECTION_ONE = "RIGHT_TO_LEFT"; // if swiping left or right and the animation is animating in the oposite direction then
// FrameAnimationController.SWIPE_DIRECTION_TWO = "LEFT_TO_RIGHT"; // switch SWIPE_DIRECTION_ONE = LEFT_TO_RIGHT & SWIPE_DIRECTION_TWO = RIGHT_TO_LEFT.
// FrameAnimationController.ANIMATION_INCREASE_FRAME_RATE = 4;
// FrameAnimationController.ANIMATION_REDUCE_FRAME_NUMBER = 10;

// FrameAnimationController.prototype.init = function (layer) {
//   this.callSuper(layer);

//   // Apply all timers here
//   this.timer = { 
//     animate: null, 
//     removeInactiveClass: null,
//     createAnimationValues: null  
//   }; 
// };

// FrameAnimationController.prototype.handleEvent = function (event) {
//   this.callSuper(event); 
//   var point = iAd.Point.fromEvent(event);
//   switch (event.type) {

//     case iAd.Event.START_EVENT:
//     this.stopTimer = false;
//     this.onTapDown(point.x);
//     break; 

//     case iAd.Event.MOVE_EVENT:
//     this.drag(point.x);
//     break;  

//     case iAd.Event.END_EVENT:
//     this.stopTimer = true;
//     this.onTapUp();
//     break;  
//   } 
// };

// FrameAnimationController.prototype.template = function () {
//   return {
//     pixels: 48,
//     numberOfFrames: 12,
//     startOnFrameNumber: 1,
//     skipFrameNumbers: [],
//     lockPositions: [],
//     animation: true,
//     intro: {
//       direction: "LEFT_TO_RIGHT",
//       numberOfFramesToAnimate: 10,
//       animationFrameRate: 250
//       }
//     }   
// };    


// FrameAnimationController.prototype.setupFrameAnimation = function (obj, delegate) {
//  this._delegate = delegate;
//  this.animationControl = this.template();
 
//  for (var name in obj) {
//   this.animationControl[name] = obj[name];
//  }
 
//  this.frameSetUp(this.animationControl.startOnFrameNumber);
//  this.skipSelectedAnimationFrames(false);  
 
//  if (!this.animationControl.intro) {
//    this.removeInactiveClass();
//    this.introAnimationCompleted = true;   
//  }     
// };

// FrameAnimationController.prototype.frameSetUp = function (num) {
//   this.frameNumber = num;
//   this.previousFrame = num;
//   this.imgElements = this.layer.querySelectorAll(".img-container");
//   this.imgElements[0].addClassName("car" + num);   
// };

// FrameAnimationController.prototype.skipSelectedAnimationFrames = function (b) {
//   if (this.animationControl.skipFrameNumbers[0]) {
//     this.skipSelectedFrames = b;    
//   } 
// };

// FrameAnimationController.prototype.introAnimation = function () {
//   this.introAnimationCompleted = false;
//   this.directionTracker = this.animationControl.intro.direction;
//   this.animationFrameRate = this.animationControl.intro.animationFrameRate;
//   this.animationFrameNumber = this.animationControl.intro.numberOfFramesToAnimate;
//   this.animate();
// };

// FrameAnimationController.prototype.removeInactiveClass = function () {
//   this.layer.removeClassName("inactive");
//   adController.hideLoadingIndicator();
//   this.triggerDelegateMethod("INTRO_ANIMATION_COMPLETED", null); 
// };

// FrameAnimationController.prototype.onTapDown = function (x) {
//   this.trackCoordinatesX = null;
//   this.startPosX = x;
//   this.posX = x;   

//   if (this.animationControl.animation) {
//     this.milliseconds = 0;
//     this.createAnimationValues();
//     clearTimeout(this.animationTimer); 
//   }
//   this.triggerDelegateMethod("TAP_DOWN", this.frameNumber)  
//   this.onTapPosition = x; 
// };

// FrameAnimationController.prototype.onTapUp = function () {
//   if (!this.animationControl.animation) {
//     this.animate();
//   }

//   // If user does not drag then it is a tap
//   if (this.onTapPosition === this.posX) {
//     this.triggerDelegateMethod("FRAME_NUMBER_ON_TAP", this.frameNumber);
//   }   
// };

// FrameAnimationController.prototype.createAnimationValues = function () {
//   if (!this.stopTimer) {
//     this.timerControl("createAnimationValues", 10);
//     this.milliseconds += 1;  
//   }
//   else {
//     // applied to animate timer
//     this.animationFrameRate = Math.abs(this.milliseconds / (this.startPosX-this.posX) * 1000);
//     this.animationFrameRate = this.animationFrameRate * FrameAnimationController.ANIMATION_INCREASE_FRAME_RATE;

//     // Applied to animate() for loop
//     this.animationFrameNumber = Math.round((this.startPosX-this.posX) / this.milliseconds);
//     this.animationFrameNumber = Math.round(Math.abs(this.animationFrameNumber / FrameAnimationController.ANIMATION_REDUCE_FRAME_NUMBER));
//     this.animate();
//   } 
// };

// FrameAnimationController.prototype.drag = function (x) {
//   this.directionX = this.posX >= x ? FrameAnimationController.SWIPE_DIRECTION_ONE : FrameAnimationController.SWIPE_DIRECTION_TWO;
//   this.posX = x;

//   if (this.directionX === "RIGHT_TO_LEFT") {
//     this.startPosX = this.directionTracker !== "RIGHT_TO_LEFT" ? x : this.startPosX; // get new start X position when direction changes
//     this.directionTracker = "RIGHT_TO_LEFT";
//     this.dragRightToLeft(x);  
//   }
//   else {
//     this.startPosX = this.directionTracker !== "LEFT_TO_RIGHT" ? x : this.startPosX; // get new start X position when direction changes
//     this.directionTracker = "LEFT_TO_RIGHT";
//     this.dragLeftToRight(x);  
//   }  
// };

// FrameAnimationController.prototype.getCoordinatesX = function (x) {
//   // get new or previous X coordinates
//   this.trackCoordinatesX = !this.trackCoordinatesX ? Math.round(x / this.animationControl.pixels) : this.trackCoordinatesX;
//   return this.trackCoordinatesX;   
// };

// FrameAnimationController.prototype.dragRightToLeft = function (x) {
//   if (this.getCoordinatesX(x) > Math.round(x / this.animationControl.pixels)) {
//     this.nextFrame();
//     this.trackCoordinatesX = Math.round(x / this.animationControl.pixels);
//   }     
// };

// FrameAnimationController.prototype.dragLeftToRight = function (x) {
//   if (this.getCoordinatesX(x) < Math.round(x / this.animationControl.pixels)) {
//     this.nextFrame();
//     this.trackCoordinatesX = Math.round(x / this.animationControl.pixels);
//   }  
// };

// FrameAnimationController.prototype.nextFrame = function () {
//   if (this.directionTracker === "RIGHT_TO_LEFT") {
//     this.frameNumber = this.frameNumber < this.animationControl.numberOfFrames ? this.frameNumber += 1 : 1;

//     if (this.animationControl.skipFrameNumbers[0] && this.skipSelectedFrames) {
//       this.frameNumber = this.frameNumber === this.animationControl.skipFrameNumbers[0] ? 20 : this.frameNumber;
//     } 
//   }
//   else {
//     this.frameNumber = this.frameNumber > 1 ? this.frameNumber -= 1 : this.animationControl.numberOfFrames;

//     if (this.animationControl.skipFrameNumbers[1] && this.skipSelectedFrames) {
//       this.frameNumber = this.frameNumber === this.animationControl.skipFrameNumbers[1] ? 12 : this.frameNumber;
//     }  
//   }

//   this.previousFrame = !this.previousFrame ? this.frameNumber : this.previousFrame;
//   this.triggerDelegateMethod("FRAME_NUMBER", this.frameNumber) 

//   this.imgElements[0].addClassName("car" + this.frameNumber);
//   this.imgElements[0].removeClassName("car" + this.previousFrame);
//   this.previousFrame = this.frameNumber;   
// };

// FrameAnimationController.prototype.animate = function () {
//   if (this.animationFrameNumber > 1) {
//     this.nextFrame();
//     this.timerControl("animate", this.animationFrameRate);
//     this.animationFrameNumber -= 1;  
//   }
//   else {
//     if (this.findLockPosition()) {
//       this.triggerDelegateMethod("LAST_FRAME_NUMBER", this.frameNumber);
      
//       if (!this.introAnimationCompleted) {
//         this.introAnimationCompleted = true;
//         this.removeInactiveClass();    
//       }    
//     }  
//     else {
//       this.nextFrame();
//       this.timerControl("animate", 60);  
//     } 
//   } 
// };

// FrameAnimationController.prototype.findLockPosition = function () {
//   if (this.animationControl.lockPositions.length) {

//     for (var i = 0; i<this.animationControl.lockPositions.length; i += 1) {
//       if (this.animationControl.lockPositions[i] === this.frameNumber) {
//         return true;
//       } 
//     } 
//   } 
//   else {
//     return true; 
//   } 
// };

// FrameAnimationController.prototype.resetCar = function () {
//   for (var i = 0; i < (this.animationControl.numberOfFrames - 1); i += 1) {
//     this.imgElements[0].removeClassName("car" + (i + 1));
//   }

//   this.imgElements[0].addClassName("car" + this.animationControl.startOnFrameNumber);
//   this.frameNumber = this.animationControl.startOnFrameNumber;
//   this.previousFrame = this.frameNumber;
//   this.layer.addClassName("inactive");
//   this.skipSelectedFrames = false;

//   clearTimeout(this.timer.animate);
//   clearTimeout(this.timer.removeInactiveClass);
//   clearTimeout(this.timer.createAnimationValues); 
// };

// FrameAnimationController.prototype.timerControl = function (methodName, delay) {
//   var that = this;
//   clearTimeout(this.timer[methodName]);
//   this.timer[methodName] = setTimeout(function () {
//     that[methodName]();
//   }, delay);   
// };

// FrameAnimationController.prototype.triggerDelegateMethod = function (constantName, num) {
//   if (iAd.Utils.objectHasMethod(this._delegate, FrameAnimationController[constantName])) {
//     this._delegate[FrameAnimationController[constantName]](num);
//   }
// };
