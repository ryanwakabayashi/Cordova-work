// Below is the copyright agreement for the Ptolemy II system.
//
// Copyright (c) 2015-2016 The Regents of the University of California.
// All rights reserved.
//
// Permission is hereby granted, without written agreement and without
// license or royalty fees, to use, copy, modify, and distribute this
// software and its documentation for any purpose, provided that the above
// copyright notice and the following two paragraphs appear in all copies
// of this software.
//
// IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY
// FOR DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES
// ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF
// THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE POSSIBILITY OF
// SUCH DAMAGE.
//
// THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE SOFTWARE
// PROVIDED HEREUNDER IS ON AN "AS IS" BASIS, AND THE UNIVERSITY OF
// CALIFORNIA HAS NO OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES,
// ENHANCEMENTS, OR MODIFICATIONS.
//
//
// Ptolemy II includes the work of others, to see those copyrights, follow
// the copyright link on the splash page or see copyright.htm.

/**
 * Module for BLE discovery and connection.
 *
 * @module ble
 * @author Colin Campbell, Ryan Wakabayashi
 * @version $$Id:
 */

exports.requiredPlugins = ['cordova-plugin-ble'];
var connectedDevice = {};
var isConnected = false;

exports.connect = function() {

   document.addEventListener('deviceready', onDeviceReady, false);
   document.getElementById("onStartScan").addEventListener("click", onStartScan);
   document.getElementById("onStopScan").addEventListener("click", onStopScan);

   function onDeviceReady(){
       document.querySelector('#message').innerHTML =
            '<button id="onStartScan" style="width:50%; background-color:green; font-size:20px; color:white">Start Scan</button>' +
            '<button id="onStopScan" style="width:50%; background-color:red; font-size:20px">Stop Scan</button>';
   }

   function onStartScan(){
       startScan(function(devices){
             displayHandler(devices);
                                    }, 100);
   }

   var self = this;
   var devices = {};

   function startScan (fn){

       devices = {};
       processed = [];

       document.querySelector('#found-devices').innerHTML = "";
           evothings.ble.startScan(

                function(device){
                    device.timeStamp = Date.now();
                    if(device.name != "undefined"){
                       devices[device.address] = device
                    }
                    fn(devices);
                },
                function(error){
                });
   }

   function onStopScan(){
       evothings.ble.stopScan();
//               document.querySelector('#found-devices').innerHTML = "Scan stopped";
   }

    var processed = [];
    function displayHandler(devices) {
        displayDevices(devices);
        self = this;
        function displayDevices(devices){
            var timeNow = Date.now();
            for (var key in devices)
            {
                var device = devices[key];
                var name = device.name || 'no name';

                if(name != "no name" && !(processed.includes(name))){
                    processed.push(name);
                    var button = document.createElement("button");
                    button.innerHTML = device.name;
                    button.setAttribute('id', device.address);
//                    button.style.padding = '8px';
//                    button.style.width = '40%';
                    button.setAttribute('class', "btn btn-outline-dark btn-block");
                    button.onclick = function(d){
                        evothings.ble.stopScan();
                        document.querySelector('#found-devices').innerHTML = '';
                        document.querySelector('#message').innerHTML = "";
                        found(devices[d.target.id]);
                        deviceConnect(devices[d.target.id]);
                    };
                    document.querySelector('#found-devices').appendChild(button);
                    document.querySelector('#found-devices').appendChild(document.createElement('br'));
                }
            }
        }
    }


    function deviceConnect(d){
        var device = d;
        document.querySelector('#found-devices').innerHTML += 'Connecting to ' + device.name;
        function connect(device, fn){
            evothings.ble.connectToDevice(
                  device,
                  function(device){
                    //console.log('Connected to device: ' + device.name);
                    document.querySelector('#found-devices').innerHTML = 'Connected to device: ' + device.name;
//                    connectedDevice.device = device;
                    fn(connectedDevice.device);
                  },
                  function(device){
                    console.log('Disconnected from device: ' + device.name);
                  },
                  function(errorCode){
                    console.log('Connect error: ' + errorCode);
            });
        }
        connect(d);
    };
}

function found (d){
    connectedDevice.device = d;
}

exports.subscribe = function(successCallback, errorCallback, sensor_type){

    var timer = setInterval(function(){
                        if(connectedDevice.device != null){
                            clearInterval(timer);
                            setTimeout(getServices, 4000);
                        }
    }, 500);

   function getServices(){
        evothings.ble.readAllServiceData(
                 connectedDevice.device,
                 function(services){
                    connectedDevice.services = services;
                    getCharacteristic();
                 },
                 function(errorCode){
                    console.log('Services error: ' + errorCode);
                    errorCallback();
                 });
   }

   function getCharacteristic(){

        for (var sIndex in connectedDevice.services){
            var service = connectedDevice.services[sIndex];
            for (var cIndex in service.characteristics){
                var characteristic = service.characteristics[cIndex];
                getDescriptors(characteristic);
            }
        }
   }

   function getDescriptors(characteristic){


        evothings.ble.descriptors(
                connectedDevice.device,
                characteristic,
                function(descriptors)
                {
                    for( var i in descriptors){
                        var descriptor = descriptors[i];
                        discoverSensor(descriptor,function(){
                            connectedDevice.characteristic = characteristic;
                            getData();
                        });
                    }
                    console.log('found descriptors:');

                },
                function(errorCode)
                {
                    console.log('descriptors error: ' + errorCode);
                    errorCallback();
                });
   }

   function discoverSensor(descriptor, subscribe){

         evothings.ble.readDescriptor(
                connectedDevice.device,
                descriptor,
                function(data)
                {
                    var cleanedData = String.fromCharCode.apply(null, new Uint8Array(data));
                    if (cleanedData == sensor_type){
                            subscribe();
                    }
                },
                function(errorCode)
                {
                    console.log('readDescriptor error: ' + errorCode);
                    errorCallback();
                });
   }

   function getData(){

        evothings.ble.enableNotification(
                connectedDevice.device,
                connectedDevice.characteristic,
                function(data)
                {
                     var buff = new Uint8Array(data);
                     var cleanedData = buff[0];
                     successCallback(cleanedData);
                },
                function(errorCode)
                {
                    console.log('enableNotification error: ' + errorCode);
                    errorCallback();
                });
   }
};