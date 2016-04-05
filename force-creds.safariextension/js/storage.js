var sfdcCredsStorage = angular.module('sfdcCredsStorage', ['ngStorage']);

sfdcCredsStorage.factory('storageCtrl', ['$localStorage', function ($localStorage) {
  var data = $localStorage.$default({
    groups: [
      {
        id: '0',
        name: 'General'
      }
    ],
    logins: {}
  });

  var newCred = function(username,password,securityToken,loginURL,group,description) {
    data.logins[username] = {
      'username': username,
      'password': password,
      'securityToken': securityToken,
      'loginURL': loginURL,
      'group': group?group:'General',
      'description': description
    }
  };

  var doubleCheckGroups = function(){
    angular.forEach(data.logins,function(cred,key){
      if(data.groups.indexOf(cred.group) < 0) {
        data.groups.push(cred.group);
      }
    });
  }

  var openCred = function(cred) {
    if(typeof safari !== 'undefined'){
      safari.application.activeBrowserWindow.openTab().url = cred.loginURL+'?un='+window.encodeURIComponent(cred.username)+'&pw='+window.encodeURIComponent(cred.password);
    }
    else{
      window.open(cred.loginURL+'?un='+window.encodeURIComponent(cred.username)+'&pw='+window.encodeURIComponent(cred.password),'_blank');
    }
  }

  var moveGroupToIndex = function(group,index) {
    doubleCheckGroups();
    var old_index = data.groups.indexOf(group);
    if (index >= data.groups.length) {
        var k = index - data.groups.length;
        while ((k--) + 1) {
            data.groups.push(undefined);
        }
    }
    data.groups.splice(index, 0, data.groups.splice(old_index, 1)[0]);
    return data.groups;
  };

  var x2js_instance = new X2JS();

  var convertForceComLogins = function(xml_str) {
    var jsonimport = x2js_instance.xml_str2json(xml_str);
    var groupMap = {};
    //var groupList = [];
    if(jsonimport) {
      angular.forEach(jsonimport.root.groups.group,function(group) {
        groupMap[group._id] = group._name;
        //groupList.push(group._name);
      });

      var creds = [];
      angular.forEach(jsonimport.root.accounts.account,function(account){
        creds.push({
          _username: account._username,
          _password: window.decodeURIComponent(account._password),
          _token: account._token,
          _baseUrl: window.decodeURIComponent(account._baseUrl),
          _groupName: groupMap[account._groupid],
          _description: account.description
        });
        /*newCred(account._username,
          window.decodeURIComponent(account._password),
          account._token,
          account._baseUrl,
          account._groupid == "default"?"General":groupMap[account._groupid],
          account._description);*/
      });
      doubleCheckGroups();
    }
  };

  var removeByLogin = function(login) {
    removeByUsername(login.username);
  };

  var removeByUsername = function(username) {
    /*var tempLogins = {};
    angular.forEach(data.logins,function(login,un){
      if(un != username)
        tempLogins[un] = login;
    });
    data.logins = null;
    data.logins = tempLogins;*/
    delete data.logins[username];
  };

  doubleCheckGroups();

  return {
    logins: data.logins,
    newCred: newCred,
    groups: data.groups,
    moveGroupToIndex: moveGroupToIndex,
    openCred: openCred,
    convertForceComLogins: convertForceComLogins,
    removeByLogin: removeByLogin
  }
}]);
/*
{
  groups: [
    {
      id: '_138302dfako',
      name: 'Group2'
    }
    {
      id: '_138302dfako',
      name: 'Group1'
    }
    {
      id: '_138302dfako',
      name: 'Group3'
    }
  ],
  logins: {
    'email@email.com': {
      username: 'email@email.com',
      password: 'heythere',
      securityToken: 'kjahf98fywkfjhas0adfsav',
      loginURL: 'https://login.salesforce.com/',
      group: 'Group2'
    }
  }
}

{
  groups: [
    {
      name: 'Group2',
      logins: {
        'email2@email.com' : {
          username: 'email@email.com',
          password: 'heythere',
          securityToken: 'kjahf98fywkfjhas0adfsav',
          loginURL: 'https://login.salesforce.com/'
        }
      }
    }
  ]
}

*/


var Storage = {
  prefix: 'login_',

  newCredential: function(creds,callback) {
    if(creds.username && creds.password) {
      var cred = {};
      cred[Storage.prefix+creds.username] = creds;
      chrome.storage.sync.set(cred,function() {
        callback({success:true});
      });
      Storage.newGroup(creds.group);
    } else {
      callback({success:false,error:"No username or password"});
    }
  },

  newCredentials: function(creds,callback) {
    var cred = {};
    var groups = [];
    for(var i in creds) {
      var credTemp = creds[i];
      cred[Storage.prefix+credTemp.username] = credTemp;
      groups.push(credTemp.group);
    }
    chrome.storage.sync.set(cred,function() {
      callback({success:true});
    });
    Storage.newGroups(groups);
  },

  getAllCredentials: function(callback) {
    chrome.storage.sync.get(null,function(items) {
      var tempArray = []
      console.log('prefix:' +Storage.prefix);
      for(var i in items) {
        console.log('i='+i);
        console.log('i starts with prefix: '+i.startsWith(Storage.prefix))
        if(i.startsWith(Storage.prefix)) {
          tempArray.push(items[i]);
        }
      }
      callback(tempArray);
    });
  },

  getCredential: function(key,callback) {
    chrome.storage.sync.get(Storage.prefix+key,function(items) {
      callback(items);
    });
  },

  groupKey: "groups",
  getGroups: function(callback) {
    chrome.storage.sync.get(Storage.groupKey,function(result) {
      callback(result[Storage.groupKey]);
    });
  },
  newGroup: function(key) {
    console.log('creating new group: '+key);
    chrome.storage.sync.get(Storage.groupKey,function(result) {
      result = result[Storage.groupKey];
      console.log('result:'+result);
      if(Object.prototype.toString.call(result) === '[object Array]'){
        console.log('an array already exists');
        var alreadyExists = false;
        for(var i in result) {
          if(i == key) alreadyExists = true;
        }
        if(!alreadyExists) {
          console.log(key+' does not exist yet')
          var groupSet = {};
          result.push(key);
          groupSet[Storage.groupKey] = result;
          chrome.storage.sync.set(groupSet,function(){});
        }
      } else {
        console.log('no array exists');
        var groupSet = {};
        groupSet[Storage.groupKey] = [key];
        chrome.storage.sync.set(groupSet,function(){});
      }
    });
  },
  newGroups: function(keys) {
    console.log('creating new groups: '+keys);
    chrome.storage.sync.get(Storage.groupKey,function(result) {
      result = result[Storage.groupKey];
      console.log('result:'+result);
      if(Object.prototype.toString.call(result) === '[object Array]'){
        console.log('an array already exists');
        var newGroupArray = [];
        for(var i in keys) {
          var alreadyExists = false;
          for(var j in result) {
            if(keys[i] == result[j]) {
              alreadyExists = true;
            }
          }
          if(!alreadyExists) {
            console.log(keys[i]+' does not exist yet')
            result.push(keys[i]);
          }
        }
        var groupSet = {};
        groupSet[Storage.groupKey] = result;
        chrome.storage.sync.set(groupSet,function(){});
      } else {
        console.log('no array exists');
        var groupSet = {};
        var newArray = [];
        for(var i in keys) {
          var alreadyExists = false;
          for(var j in newArray) {
            if(keys[i] == newArray[j]) {
              alreadyExists = true
            }
          }
          if(!alreadyExists) {
            newArray.push(keys[i]);
          }
        }
        groupSet[Storage.groupKey] = newArray;
        chrome.storage.sync.set(groupSet,function(){});
      }
    });
  }
}