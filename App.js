// global.TextEncoder = require("utf8-encoding").TextEncoder;

import React, {Component} from 'react';
import { Alert, Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { StackNavigator } from 'react-navigation';

import LoginView from './containers/LoginView';

// make btoa globally available for cmis module
if (!global.btoa) {
  global.btoa = require('base-64').encode;
}

// global.TextEncoder = require("utf8-encoding").TextEncoder;

if (typeof (window) === 'undefined') {
  console.log("Window is undefined...");
  // var window = {};
} else {
  console.log("Window is DEFINED...");
  
}
const App = StackNavigator({
  LoginView: {screen: LoginView},
},
{
  initialRouteName: 'LoginView',
  headerMode: 'none'
});

export default App;