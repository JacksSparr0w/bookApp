/* --- src/defineAgeLimit-common.js --- */
var DefineAgeLimit = {};

function extend(child, parent) {
  var F = function() {};
  F.prototype = parent.prototype;
  child.prototype = new F();
  child.prototype.constructor = child;
  child.superclass = parent.prototype;
}


/* --- src/defineAgeLimit-paintPanel.js --- */
/**
 * Paint panel.
 */

var myAddr;

DefineAgeLimit.PaintPanel = function(containerId) {
  this.containerId = containerId;
  this.sc_type_arc_pos_var_perm =
    sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm;
};

DefineAgeLimit.PaintPanel.prototype = {
  init: function() {
    this._initMarkup(this.containerId);
  },

  _initMarkup: function(containerId) {
    var container = $("#" + containerId);

    new Promise(function(resolve) {
      window.sctpClient
        .create_node(sc_type_node | sc_type_const)
        .done(function(allEventsNode)
         {
          window.sctpClient.create_link().done(function(allEventsNodeLink) {
          window.sctpClient
            .create_arc(
                sc_type_arc_common | sc_type_const,
                allEventsNode,
                allEventsNodeLink
              )
              .done(function(generatedCommonArc) {
                window.sctpClient
                  .create_arc(
                    sc_type_arc_pos_const_perm,
                    scKeynodes.nrel_system_identifier,
                    generatedCommonArc
                  )
                  .done(function() {
                    resolve(allEventsNode);
                  });
              });
          });
        });
    }).then(response => {
      var self = this;
      container.append('<div class="sc-no-default-cmd"><h3 ">Определить возрастное ограничение книги</h3></div>');
      self._showBooks(containerId);
     
      container.append(
        '<input style="width:30%" type = "button" class = "btn btn-success sc-no-default-cmd" value = "Определить" id= "define-button">'
      );
      container.append("<br>");

      $("#define-button").click(function() {
        self._defineAgeLimit(response);
      });
    });

  },

  _defineAgeLimit: function(allEventsNode) {
    var self = this;
    myAddr=$("#event_type option:selected").val();
    self._addToSearchList(allEventsNode, myAddr);
    
    SCWeb.core.Server.resolveScAddr(["ui_menu_file_for_agent_of_define_age_limit"], function(data) {
      var cmd = data["ui_menu_file_for_agent_of_define_age_limit"];
      SCWeb.core.Main.doCommand(cmd, [myAddr], function(result) {
        if (result.question != undefined) {
          SCWeb.ui.WindowManager.appendHistoryItem(result.question);
        }
      });
    });
  },

  _addToSearchList: function(response, addr) {
    window.scHelper
      .checkEdge(response, sc_type_arc_pos_const_perm, addr)
      .fail(function() {
        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, response, addr);
      });
  },

  _showBooks: function(divId) {
    var container = $("#" + divId);
    SCWeb.core.Server.resolveScAddr(["book"], function(keynodes) {
      var book_addr = keynodes["book"];
      window.sctpClient
        .iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, [
          book_addr,
          sc_type_arc_pos_const_perm | sc_type_const,
          sc_type_node
        ])
        .done(function(books) {
          var books_addr = books.map(event => event[2]);

          SCWeb.core.Server.resolveIdentifiers(books_addr, function(keynodes) {
            var book_name = [];
            var strProm = '<select id ="event_type" class="form-control" style="width:30%;">';
            for (var i = 0; i <= books_addr.length - 1; i++) {
              book_name[i] = keynodes[books_addr[i]];
              strProm += '<option value="' + books_addr[i];
              strProm += '">' + book_name[i] + "</option>";
            }
            strProm += "</select>";

            container.append(strProm);
          });
        });
    });
  },

};



/* --- src/defineAgeLimit-component.js --- */
DefineAgeLimit.DrawComponent = {
  ext_lang: "define_age_limit_view",
  formats: ["format_define_age_limit"],
  struct_support: true,
  factory: function(sandbox) {
    return new DefineAgeLimit.DrawWindow(sandbox);
  }
};

DefineAgeLimit.DrawWindow = function(sandbox) {
  this.sandbox = sandbox;
  this.paintPanel = new DefineAgeLimit.PaintPanel(this.sandbox.container);
  this.paintPanel.init();
  this.recieveData = function(data) {
    console.log("in recieve data" + data);
  };

  var scElements = {};

  function drawAllElements() {
    var dfd = new jQuery.Deferred();
    // for (var addr in scElements) {
    jQuery.each(scElements, function(j, val) {
      var obj = scElements[j];
      if (!obj || obj.translated) return;
      // check if object is an arc
      if (obj.data.type & sc_type_arc_pos_const_perm) {
        var begin = obj.data.begin;
        var end = obj.data.end;
        // logic for component update should go here
      }
    });
    SCWeb.ui.Locker.hide();
    dfd.resolve();
    return dfd.promise();
  }

  // resolve keynodes
  var self = this;
  this.needUpdate = false;
  this.requestUpdate = function() {
    var updateVisual = function() {
      // check if object is an arc
      var dfd1 = drawAllElements();
      dfd1.done(function(r) {
        return;
      });

      /// @todo: Don't update if there are no new elements
      window.clearTimeout(self.structTimeout);
      delete self.structTimeout;
      if (self.needUpdate) self.requestUpdate();
      return dfd1.promise();
    };
    self.needUpdate = true;
    if (!self.structTimeout) {
      self.needUpdate = false;
      SCWeb.ui.Locker.show();
      self.structTimeout = window.setTimeout(updateVisual, 1000);
    }
  };

  this.eventStructUpdate = function(added, element, arc) {
    window.sctpClient.get_arc(arc).done(function(r) {
      var addr = r[1];
      window.sctpClient.get_element_type(addr).done(function(t) {
        var type = t;
        var obj = new Object();
        obj.data = new Object();
        obj.data.type = type;
        obj.data.addr = addr;
        if (type & sc_type_arc_mask) {
          window.sctpClient.get_arc(addr).done(function(a) {
            obj.data.begin = a[0];
            obj.data.end = a[1];
            scElements[addr] = obj;
            self.requestUpdate();
          });
        }
      });
    });
  };
  // delegate event handlers
  this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
  this.sandbox.eventStructUpdate = $.proxy(this.eventStructUpdate, this);
  this.sandbox.updateContent();
};
SCWeb.core.ComponentManager.appendComponentInitialize(
  DefineAgeLimit.DrawComponent
);


