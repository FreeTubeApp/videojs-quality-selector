import CustomEvents from '../events.js';
import QualityOption from './QualityOption.js';
import videojs from 'video.js';
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
      player.on(CustomEvents.QUALITY_REQUESTED, function(event, newSource) {
        this.setSelectedSource(newSource);
        player.addClass(QualityChangeClass);

        player.one('loadeddata', function() {
            player.removeClass(QualityChangeClass);
        });
      }.bind(this));

      // Update the list of menu items only when the list of sources change
      player.on(CustomEvents.PLAYER_SOURCES_CHANGED, function() {
        this.update();
      }.bind(this));

      player.on(CustomEvents.QUALITY_SELECTED, function(event, newSource) {
        // Update the selected source with the source that was actually selected
        this.setSelectedSource(newSource);
      }.bind(this));

      // Since it's possible for the player to get a source before the selector is
      // created, make sure to update once we get a "ready" signal.
      player.one('ready', function() {
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
      var source_ = (source ? source.src : undefined);

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

      return sources.map(function(source) {
        return new QualityOption(player, {
            source: source,
            selected: source.src === this.selectedSrc,
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
export default QualitySelector
