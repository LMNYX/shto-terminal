const help_list = {
    'cd': 'switch directory',
    'ls': 'list directory',
    'cat': 'read a file',
    'whoami': null,
    'uswitch': 'switch user',
    'reboot': 'restart OS',
    'testarg': null,
    'ps': 'enter public system',
    'dignity': 'ëëçêòàóćāçååőœī óćāçååőœ'
};

ENTINCO_VER = "1.76";

CHANGE_LOG = `* Updated file system\n* Updated security with adding secret sessions, that change every restart.`;

const DebugMode = false;

class TerminalUserInfo
{
    constructor(username, permIndex, canSudoIn, displayName)
    {
        this.username = username;
        this.displayName = displayName != null ? displayName : username;
        this.permIndex = permIndex;
        this.canSudoIn = canSudoIn;

        this.secret = DebugMode ? "debugmodeactive" : uuidv4();
    }
}

class VirtualDirectory
{
    constructor(name, contents, access_right)
    {
        this.name = name;
        this.contents = contents;
        this.access_level = access_right != undefined ? access_right : 0;
        this.sess_secret = DebugMode ? "debugmodeactive" : uuidv4();
    }   
}

class VirtualFile
{
    constructor(name, contents, access_right)
    {
        this.name = name;
        this.contents = contents;
        this.access_level = access_right != undefined ? access_right : 0;
        this.sess_secret = DebugMode ? "000" : uuidv4();
    }
}

class VirtualRootDirectory
{
    constructor(contents)
    {
        this.contents = contents;
        this.sess_secret = DebugMode ? "000" : uuidv4();
    }
}

const PermGroupDisplayName = [
    "User",
    "Admin"
];

const Game = require(__dirname+"/virtualgame.js");

const users = {
    "guest": new TerminalUserInfo("guest", -1, true),
    "dummy": new TerminalUserInfo("dummy", -1, true)
};

const VirtualDisk = new VirtualRootDirectory([
    new VirtualDirectory("root", [ new VirtualFile("test.txt", "test!!!") ]),
    new VirtualDirectory("guest", [
        new VirtualFile("test.txt", `Test!`, -1)
    ], -1),
    new VirtualDirectory("usr", [
        new VirtualDirectory("james", [
            new VirtualFile("test.txt", "Test file!",-1)
        ], -1),
    ], -1)
]);

// file_path = /root/test.txt
function GetVirtualEntry(file_path)
{
    let _actual_path = file_path.split('/');
    let _curr;
    if(_actual_path.length == 2 &&  _actual_path[0] == "" && _actual_path[1] == "")
        return VirtualDisk;
    switch (_actual_path[0]) {
        case "~":
            return "NotImplemented";
            break;
        case "":
        default:
            try
            {
                for(let vf in _actual_path)
                {
                    if(vf == 0 && _actual_path[vf] == "")
                    {
                        _curr = VirtualDisk;
                        continue;
                    }

                    let _tempRes = _curr.contents.find(fl => fl.name == _actual_path[vf]);
                    if(_tempRes == undefined)
                        return [false, "Directory or file doesn't exist. (1)"];
                    if(_tempRes.constructor.name == "VirtualFile" && _actual_path.length-1 > vf)
                        return [false, "Directory or file doesn't exist. (2)"];
                    _curr = _tempRes;
                }
            }
            catch(e)
            {
                return [false, "Directory or file doesn't exist. (3)", e.toString()];
            }
            break;
    }
    return _curr;
}

function GetGuestDirectoryData()
{
    let _gData = GetVirtualEntry("/guest");
    return _gData;
}

function uuidv4() { // pseudo
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function run(req)
{
    let cmd = req.body.data.split(' ');
    let args = [...cmd].slice(1);
    let userdata = req.body.userdata;
    let dirdata = req.body.dirdata;
    let _dir = GetVirtualEntry(dirdata.path);
    if(_dir.constructor.name == "VirtualFile" || (_dir.name == undefined && _dir.constructor.name != "VirtualRootDirectory"))
        return {'fixedText': "CRITICAL ERROR: User directory is corrupted or doesn't exist at all. Try rebooting your machine!"};
    if(_dir.sess_secret != dirdata.secret)
        return {'fixedText': "CRITICAL ERROR: User directory secret doesn't match up with system's. You should try rebooting your machine to resolve this problem."};
    if(_dir.access_level > users[userdata.user].permIndex)
        return {'fixedText': "CRITICAL ERROR: User permissions are too low to get access to current directory. Try rebooting your machine to resolve the problem."};
    if( !(req.body.userdata.user in users) || !users[req.body.userdata.user].canSudoIn || users[req.body.userdata.user].secret != req.body.userdata.secret )
        return {"fixedText": "CRITICAL ERROR: UserData doesn't match up! User provided data isn't correct. Reboot your system manually to resolve the problem!"};
    switch(cmd[0])
    {
        case "testarg":
            return {'fixedText': 'Arguments: '+args.join(', ')};
        case "help":
            let _tempVar = "";
            for(cm in help_list)
                _tempVar += `${cm} - ${help_list[cm] == null ? "No description provided" : help_list[cm]}\n`; 
            return {'fixedText': _tempVar};
        case "donate":
            return {'fixedText': 'You can show your appreciation at <a href="https://paypal.me/mishawto">paypal.me/mishawto</a>\nThanks ♥'}
        case "uswitch":
            let _allowedToSwitch = (args[0] in users && users[args[0]].canSudoIn);
            if( !(args[0] in users) )
                return {'fixedText': 'User not found.'};
            if( !_allowedToSwitch )
                return {'fixedText': `You cannot switch user to ${args[0]} due to it's priviliges.`};
            let _user = users[args[0]];
            return {'eval': `SwitchUserData('${_user.username}', '${_user.secret}');`};
        case "jill":
            return {'fixedText': '--------------\njill.txt (1KB)\n--------------\n` Jill is fine.\n` Thanks for asking though!\n` - John-face!'}
        case "sudo":
            return {'fixedText': 'Insufficient permission to read PERM data.'};
        case "ps":
            return {'pageSwitch': '/ps'};
        case "whoami":
            return {'fixedText': `${userdata.user}/${PermGroupDisplayName[users[userdata.user].permIndex] != undefined ? PermGroupDisplayName[users[userdata.user].permIndex] : "None"}`};
        case "dignity":
            return {'eval': `/*XDDDDDDDDDDDDD GET REKT NOOB*/var _0xa1a8=["\x43\x4C\x45\x41\x52\x20\x53\x43\x52\x45\x45\x4E","\x48\x45\x4C\x4C\x4F\x2E\x20\x43\x41\x4E\x20\x59\x4F\x55\x20\x48\x45\x41\x52\x20\x4D\x45\x3F","\x73\x63\x72\x6F\x6C\x6C\x57\x69\x64\x74\x68","\x62\x6F\x64\x79","\x70\x78","\x73\x63\x72\x6F\x6C\x6C\x48\x65\x69\x67\x68\x74","\x43\x41\x4E\x20\x59\x4F\x55\x20\x48\x45\x41\x52\x20\x4D\x45\x3F","\x4E\x4F"];ProcessInstruction(_0xa1a8[0]);setInterval(function(){CreateWindow(_0xa1a8[1],{"\x6C\x65\x66\x74":randintval(0,document[_0xa1a8[3]][_0xa1a8[2]]- 1)+ _0xa1a8[4],"\x74\x6F\x70":randintval(0,document[_0xa1a8[3]][_0xa1a8[5]]- 1)+ _0xa1a8[4]})},111);setInterval(function(){SendOutput(_0xa1a8[6]);CreateWindow(_0xa1a8[1],{"\x6C\x65\x66\x74":randintval(0,document[_0xa1a8[3]][_0xa1a8[2]]- 1)+ _0xa1a8[4],"\x74\x6F\x70":randintval(0,document[_0xa1a8[3]][_0xa1a8[5]]- 1)+ _0xa1a8[4]},[_0xa1a8[7]],(_0x6479x1)=>{CloseWindow(_0x6479x1)})},111);`};
        case "reboot":
            return {'eval': `SendOutput('Performing reboot...'); window.location.reload();`};
        case "clear":
            return {'eval': `ProcessInstruction("CLEAR SCREEN");`};
        case "ls":
            let _tmpLS = _dir.contents.map((x) => { return x.constructor.name == "VirtualFile" ? x.name : `<span style='color: cornflowerblue;'>${x.name}</span>`; });
            return {'fixedText': _tmpLS.join(' ')};
        case "cat":
            let _vff = GetVirtualEntry(dirdata.path+'/'+args[0]);
            if(_vff.access_level > users[userdata.user].permIndex)
                return {'fixedText': `E: Insufficient permissions to read file.`};
            if (_vff.name == undefined)
                return {'fixedText': "E: File doesn't exist."};
            if (_vff.constructor.name == "VirtualDirectory")
                return {"fixedText": "E: Can't read directory."};
            return {'fixedText': _vff.contents};
        case "cd":
            let _dTR;
            let _dPT;
            if(args[0] == "..")
                _dPT = dirdata.path.slice(0, dirdata.path.lastIndexOf("/"));
            else
                _dPT = dirdata.path+"/"+args[0];
            _dTR = GetVirtualEntry(_dPT);
            if(_dTR.name == undefined && _dTR.constructor.name != "VirtualRootDirectory")
                return {'fixedText': `E: Directory doesn't exist.`};
            if(_dTR.access_level > users[userdata.user].permIndex)
                return {'fixedText': `E: Insufficient permissions to read directory.`};
            if(_dTR.constructor.name == "VirtualFile")
                return {"fixedText": "E: Not a directory."};
            
            return {'eval': `CurrDirectory = {'path': '${_dPT}', 'secret': '${_dTR.sess_secret}'}; SetVisualVMData("directory", "${_dPT == '' ? '/' : _dPT}");`};
        default:
            return {'fixedText': 'E: unknown command.'};
    }
  return {'resText': 'Unkonwn exception thrown.'}
}

function init(req)
{
    return require(__dirname+'/verylong.js') + `\nUserData = {"user": "guest", "secret": "${users['guest'].secret}"}\nCurrDirectory = {"path": "/guest", "secret": "${GetGuestDirectoryData().sess_secret}"}; SetVisualVMData("directory", "/guest");`;
}

module.exports = {"run": run, "init": init};