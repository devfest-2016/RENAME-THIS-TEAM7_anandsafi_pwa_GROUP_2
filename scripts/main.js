/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes Jams.
function Jams() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');

  this.positionForm = document.getElementById('position-form');
  this.positionInput = document.getElementById('event');
  this.noteInput = document.getElementById('note');
  this.submitButton2 = document.getElementById('submit_2');

  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  this.positionForm.addEventListener('submit', this.saveEvent.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
Jams.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat messages history and listens for upcoming ones.
Jams.prototype.loadMessages = function() {
  // Reference to the /messages/ database path.
  this.messagesRef = this.database.ref('Companies');
  window.databaseCall = this.messagesRef;
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    this.displayMessage(data.key, val.positions);
  }.bind(this);
  this.messagesRef.limitToLast(12).on('child_added', setMessage);
  this.messagesRef.limitToLast(12).on('child_changed', setMessage);
};

// Jams.prototype.eventListeners = function() {
//   div.querySelector('.name').click(e => alert());
// };

// Saves a new message on the Firebase DB.
Jams.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {

    // Add a new message entry to the Firebase Database.
    this.messagesRef.child(inputParts[1]).child('positions').child(inputParts[0]).set({
      events: {
        "Applied": {
          "date": "11/20/16"
        }
      }
    }).then(function() {
      // Clear message text field and SEND button state.
      Jams.resetMaterialTextfield(this.messageInput);
      this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error adding new position to Firebase Database', error);
    });
  }
};

Jams.prototype.saveEvent = function(e) {
  console.log(this);
  e.preventDefault();
  let note = this.noteInput.value;
  let name = this.positionInput.value;
  let position = document.getElementById('position-name').innerText;
  let company = document.getElementById('position-company').innerText;
  let input = {};
  input['notes'] = note;
  input['date'] = '11/20/16';

  // Check that the user entered a message and is signed in.
  if (this.positionInput.value && this.checkSignedInWithMessage()) {

    // Add a new message entry to the Firebase Database.
    this.messagesRef.child(company).child('positions').child(position).child('events').child(name).set(
      input
    ).then(function() {
      // Clear message text field and SEND button state.
      Jams.resetMaterialTextfield(this.messageInput);
      this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error adding new position to Firebase Database', error);
    });
  }
};

// Signs-in Friendly Chat.
Jams.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
Jams.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
Jams.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
Jams.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
Jams.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
Jams.MESSAGE_TEMPLATE =
    '<div class="message-container" onclick="handleCompanyOnClick(this)">' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
      '<div hidden class="events"></div>' +
    '</div>';

Jams.POSITION_TEMPLATE =
    '<div class="position-container">' +
      '<div class="name"></div>' +
      '<div class="note"></div>' +
    '</div>';

function handleCompanyOnClick(e) {
  var company = e.children[0].innerText;
  var position = e.children[1].innerText.split('\n')[0];
  var events = e.children[2].innerText.split('\n');
  displayPosition(company, position, events);
}

function displayPosition(company, position, events) {
  var dl = document.getElementById('position');
  var de = document.getElementById('events');
  events = events.map(e => {
    var parts = e.split(' # ');
    var name = parts[0];
    var notes = parts[1];
    return (
      '<div class="position-container">' +
        '<div style="font-weight: bold">' + name + '</div>' +
        '<div>' + notes + '</div>' +
      '</div>'
    )
  }).join('<br>');

  var title =
    '<div id="position-name" style="font-weight: bold; font-size: 16px;">' + position + '</div>' +
    '<div id="position-company" style="font-style: italic">' + company + '</div>'

  dl.innerHTML = title;
  de.innerHTML = events;
}

// A loading image URL.
Jams.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
Jams.prototype.displayMessage = function(key, positions) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Jams.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }

  div.querySelector('.name').innerHTML = Object.keys(positions).join('<br>');
  div.querySelector('.events').innerHTML = Object.keys(positions[Object.keys(positions)[0]].events).map(k => {
    let name = k + ' on ' + positions[Object.keys(positions)[0]].events[k].date;
    let notes = positions[Object.keys(positions)[0]].events[k].notes || '';
    return(name + ' # ' + notes);
  }).join('<br>');

  var messageElement = div.querySelector('.message');
  messageElement.textContent = key;
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');

  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
Jams.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
Jams.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

window.onload = function() {
  window.jams = new Jams();
};
