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

