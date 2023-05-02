'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var videojs = require('video.js');

class SafeSeek {
  constructor(player, seekToTime) {
    this._player = player;
    this._seekToTime = seekToTime;
    this._hasFinished = false;
    this._keepThisInstanceWhenPlayerSourcesChange = false;
    this._seekWhenSafe();
  }
  _seekWhenSafe() {
    var HAVE_FUTURE_DATA = 3;

    // `readyState` in Video.js is the same as the HTML5 Media element's `readyState`
    // property.
    //
    // `readyState` is an enum of 5 values (0-4), each of which represent a state of
    // readiness to play. The meaning of the values range from HAVE_NOTHING (0), meaning
    // no data is available to HAVE_ENOUGH_DATA (4), meaning all data is loaded and the
    // video can be played all the way through.
    //
    // In order to seek successfully, the `readyState` must be at least HAVE_FUTURE_DATA
    // (3).
    //
    // @see http://docs.videojs.com/player#readyState
    // @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
    // @see https://dev.w3.org/html5/spec-preview/media-elements.html#seek-the-media-controller
    if (this._player.readyState() < HAVE_FUTURE_DATA) {
      this._seekFn = this._seek.bind(this);
      // The `canplay` event means that the `readyState` is at least HAVE_FUTURE_DATA.
      this._player.one('canplay', this._seekFn);
    } else {
      this._seek();
    }
  }
  onPlayerSourcesChange() {
    if (this._keepThisInstanceWhenPlayerSourcesChange) {
      // By setting this to `false`, we know that if the player sources change again
      // the change did not originate from a quality selection change, the new sources
      // are likely different from the old sources, and so this pending seek no longer
      // applies.
      this._keepThisInstanceWhenPlayerSourcesChange = false;
    } else {
      this.cancel();
    }
  }
  onQualitySelectionChange() {
    // `onPlayerSourcesChange` will cancel this pending seek unless we tell it not to.
    // We need to reuse this same pending seek instance because when the player is
    // paused, the `preload` attribute is set to `none`, and the user selects one
    // quality option and then another, the player cannot seek until the player has
    // enough data to do so (and the `canplay` event is fired) and thus on the second
    // selection the player's `currentTime()` is `0` and when the video plays we would
    // seek to `0` instead of the correct time.
    if (!this.hasFinished()) {
      this._keepThisInstanceWhenPlayerSourcesChange = true;
    }
  }
  _seek() {
    this._player.currentTime(this._seekToTime);
    this._keepThisInstanceWhenPlayerSourcesChange = false;
    this._hasFinished = true;
  }
  hasFinished() {
    return this._hasFinished;
  }
  cancel() {
    this._player.off('canplay', this._seekFn);
    this._keepThisInstanceWhenPlayerSourcesChange = false;
    this._hasFinished = true;
  }
}

const CustomEvents = {
  QUALITY_REQUESTED: 'qualityRequested',
  QUALITY_SELECTED: 'qualitySelected',
  PLAYER_SOURCES_CHANGED: 'playerSourcesChanged'
};

const MenuItem = videojs.getComponent('MenuItem');

/**
 * A MenuItem to represent a video resolution
 * @class QualityOption
 * @augments MenuItem
 */
class QualityOption extends MenuItem {
  /**
   * @inheritdoc
   */
  constructor(player, options) {
    var source = options.source;
    if (!(typeof source == 'object' && !!source)) {
      throw new TypeError('was not provided a "source" object, but rather: ' + typeof source);
    }
    options = Object.assign({
      selectable: true,
      label: source.label
    }, options);
    super(player, options);
    this.source = source;
  }

  /**
   * @inheritdoc
   */
  handleClick(event) {
    super.handleClick(event);
    this.player().trigger(CustomEvents.QUALITY_REQUESTED, this.source);
  }
}

const QualityChangeClass = 'vjs-quality-changing';
const MenuButton = videojs.getComponent('MenuButton');

/**
 * A component for changing video resolutions
 * @class QualitySelector
 * @augments videojs.Button
 */
class QualitySelector extends MenuButton {
  /**
   * @inheritdoc
   */
  constructor(player, options) {
    super(player, options);

    // Update interface instantly so the user's change is acknowledged
    player.on(CustomEvents.QUALITY_REQUESTED, function (event, newSource) {
      this.setSelectedSource(newSource);
      player.addClass(QualityChangeClass);
      player.one('loadeddata', function () {
        player.removeClass(QualityChangeClass);
      });
    }.bind(this));

    // Update the list of menu items only when the list of sources change
    player.on(CustomEvents.PLAYER_SOURCES_CHANGED, function () {
      this.update();
    }.bind(this));
    player.on(CustomEvents.QUALITY_SELECTED, function (event, newSource) {
      // Update the selected source with the source that was actually selected
      this.setSelectedSource(newSource);
    }.bind(this));

    // Since it's possible for the player to get a source before the selector is
    // created, make sure to update once we get a "ready" signal.
    player.one('ready', function () {
      this.selectedSrc = player.src();
      this.update();
    }.bind(this));
    this.controlText('Open quality selector menu');
  }

  /**
   * Updates the source that is selected in the menu
   * @param {object} source player source to display as selected
   */
  setSelectedSource(source) {
    var source_ = source ? source.src : undefined;
    if (this.selectedSrc !== source_) {
      this.selectedSrc = source_;
      for (const item of this.items) {
        item.selected(item.source.src === source_);
      }
    }
  }

  /**
   * @inheritdoc
   */
  createItems() {
    var player = this.player(),
      sources = player.currentSources();
    if (!sources || sources.length < 2) {
      return [];
    }
    return sources.map(function (source) {
      return new QualityOption(player, {
        source: source,
        selected: source.src === this.selectedSrc
      });
    }.bind(this));
  }

  /**
   * @inheritdoc
   */
  buildWrapperCSSClass() {
    return 'vjs-quality-selector ' + super.buildWrapperCSSClass();
  }
}
videojs.registerComponent('QualitySelector', QualitySelector);

const Plugin = videojs.getPlugin('plugin');
class QualitySelectorPlugin extends Plugin {
  constructor(player, options) {
    videojs.registerComponent('QualitySelector', QualitySelector);
    videojs.registerComponent('QualityOption', QualityOption);
    const settings = videojs.obj.merge({}, options);
    super(player, settings);
    const videojs = player || window.videojs;
    videojs.hook('setup', function (player) {
      /**
       * Change the quality of the video.
       * @param {Event} event The qualitychhange event
       * @param {object} newSource The newSource
       */
      function changeQuality(event, newSource) {
        let sources = player.currentSources();
        let currentTime = player.currentTime();
        let currentPlaybackRate = player.playbackRate();
        let isPaused = player.paused();
        let selectedSource;

        // Clear out any previously selected sources (see: #11)
        for (const source of sources) {
          source.selected = false;
        }
        selectedSource = sources.find(source => {
          return source == newSource.src;
        });
        selectedSource.selected = true;
        if (player._qualitySelectorSafeSeek) {
          player._qualitySelectorSafeSeek.onQualitySelectionChange();
        }
        player.src(sources);
        player.ready(function () {
          if (!player._qualitySelectorSafeSeek || player._qualitySelectorSafeSeek.hasFinished()) {
            // Either we don't have a pending seek action or the one that we have is no
            // longer applicable. This block must be within a `player.ready` callback
            // because the call to `player.src` above is asynchronous, and so not
            // having it within this `ready` callback would cause the SourceInterceptor
            // to execute after this block instead of before.
            //
            // We save the `currentTime` within the SafeSeek instance because if
            // multiple QUALITY_REQUESTED events are received before the SafeSeek
            // operation finishes, the player's `currentTime` will be `0` if the
            // player's `src` is updated but the player's `currentTime` has not yet
            // been set by the SafeSeek operation.
            player._qualitySelectorSafeSeek = new SafeSeek(player, currentTime);
            player.playbackRate(currentPlaybackRate);
          }
          if (!isPaused) {
            player.play();
          }
        });
      }

      // Add handler to switch sources when the user requests a change
      player.on(CustomEvents.QUALITY_REQUESTED, changeQuality);
    });
  }
}

exports.Events = CustomEvents;
exports.default = QualitySelectorPlugin;
