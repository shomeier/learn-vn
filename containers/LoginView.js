import React, { Component } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

// import cmis from 'cmis';
import { cmis } from '../lib/cmis.js';

export default class LoginView extends Component {

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/logo.jpg')} />
                <TextInput style={styles.input}
                    placeholder="Username"
                />
                <TextInput style={styles.input}
                    placeholder="Password"
                />
                <Button
                    onPress={() => {
                        console.log("Logging in... ");

                        // var session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
                        var session = new cmis.CmisSession('http://192.168.1.105:8080/alfresco/api/-default-/public/cmis/versions/1.1/browser');
                        // var session = new cmis.CmisSession('https://cmis.alfresco.com/api/-default-/public/cmis/versions/1.1/browser');
                        console.log("Logging in.1.. ");
                        session.setCredentials('admin', 'admin');
                        session.setErrorHandler(err => console.log(err));
                        session.loadRepositories().then(() => {
                                   console.log("Loaded repos");
                                   console.log("Repos: " + JSON.stringify(session.defaultRepository));
                                }).catch(err => {
                                    console.log("Error1: " + err)
                                    console.log("Error2: " + JSON.stringify(err))
                                    console.log("Error3: " + JSON.stringify(err.response))
                                }
                            );

                        // session.setGlobalHandlers(console.log, console.log);
                        // session.setCredentials('admin','admin');
                        // session.loadRepositories().ok(function (data) {
                        //     console.log("Data1: " + JSON.stringify(data));
                        //     Alert.alert("Data1: " + JSON.stringify(data));
                        // }).notOk(function(res) {
                        //     console.log("Data2: " + JSON.stringify(res));
                        //     console.log("Data2: " + res);
                        //     Alert.alert("Data2: " + JSON.stringify(res));
                        // }).error(function(res) {
                        //     console.log("Data3: " + JSON.stringify(res));
                        //     console.log("Data3: " + res);
                        //     Alert.alert("Data3: " + JSON.stringify(res));
                        // });

                        // Alert.alert('You tapped the button!');
                    }}
                    title="Login"
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    input: {
        textAlign: 'center',
        marginTop: 5,
        width: 150,
        height: 30,
        borderColor: 'grey',
        borderWidth: 1
    }
});