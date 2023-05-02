import SafeSeek from './util/SafeSeek.js';
import CustomEvents from './events.js'
import videojs from 'video.js';
import QualityOption from './components/QualityOption.js';
import QualitySelector from './components/QualitySelector.js';
const Plugin = videojs.getPlugin('plugin');

class QualitySelectorPlugin extends Plugin {
  constructor(player, options) {
    videojs.registerComponent('QualitySelector', QualitySelector);
    videojs.registerComponent('QualityOption', QualityOption);
    const settings = videojs.obj.merge({}, options);
    super(player, settings)
    const videojs = player || window.videojs
    videojs.hook('setup', function(player) {
      /**
       * Change the quality of the video.
       * @param {Event} event The qualitychhange event
       * @param {object} newSource The newSource
       */
      function changeQuality(event, newSource) {
        let sources = player.currentSources()
        let currentTime = player.currentTime()
        let currentPlaybackRate = player.playbackRate()
        let isPaused = player.paused()
        let selectedSource;

         // Clear out any previously selected sources (see: #11)
         for (const source of sources) {
            source.selected = false;
         }

         selectedSource = sources.find((source) => {
          return source == newSource.src;
         })
         selectedSource.selected = true;

         if (player._qualitySelectorSafeSeek) {
            player._qualitySelectorSafeSeek.onQualitySelectionChange();
         }

         player.src(sources);

         player.ready(function() {
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

export default {
  QualitySelectorPlugin,
  CustomEvents
}
