cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-ble.BLE",
      "file": "plugins/cordova-plugin-ble/ble.js",
      "pluginId": "cordova-plugin-ble",
      "clobbers": [
        "evothings.ble"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-ble": "2.0.1",
    "cordova-plugin-whitelist": "1.3.4"
  };
});