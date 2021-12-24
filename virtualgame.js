class Item
{
    constructor(name, desc, ucb)
    {
        this.name = name;
        this.description = desc != null ? desc : "No description provided.";
        this.usageCallback = ucb != null ? ucb : ()=>{};
        this.secret = CreateSecret();
    }
}

function CreateSecret() { // pseudo
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// TO-DO: Add everything.