/**
 * Paint panel.
 */
var eventsNumber = 1;
var patternIsCreated = false;
var genderParamIs = false;
var nameParamIs = false;
var typeParamIs = false;

BookSearchByEvents.PaintPanel = function(containerId) {
  this.containerId = containerId;
  this.sc_type_arc_pos_var_perm =
    sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm;
};

BookSearchByEvents.PaintPanel.prototype = {
  init: function() {
    this._initMarkup(this.containerId);
  },

  _initMarkup: function(containerId) {
    var container = $("#" + containerId);

    new Promise(function(resolve) {
      window.sctpClient
        .create_node(sc_type_node | sc_type_const)
        .done(function(allEventsNode) {
          window.sctpClient.create_link().done(function(allEventsNodeLink) {
            window.sctpClient.set_link_content(allEventsNodeLink, "setEvents");
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
      container.append('<div class="sc-no-default-cmd">Поиск книги</div>');
      container.append(
        '<input type="button" class = "button-search" value="Добавить поле" id="add-field-1">'
      );
      container.append(
        '<input type = "button" class = "button-search" value= "Добавить информацию" id = "add-info-1"> '
      );
      container.append(
        '<input type = "button" class = "button-search" value = " Сгенерировать шаблон" id= "create-pattern">'
      );
      container.append(
        '<input type = "button" class = "button-search" value = " Начать поиск" id= "search-button">'
      );
      container.append("<br>");

      $("#add-field-1").click(function() {
        self._addNewParam(containerId);
      });

      $("#add-info-1").click(function() {
        self._addNewInfo(containerId);
      });

      $("#create-pattern").click(function() {
        self._createNewPattern(response);
      });
      $("#search-button").click(function() {
        self._searchBook(response);
      });
    });
  },

  _searchBook: function(allEventsNode) {
    console.log("run search");

    SCWeb.core.Server.resolveScAddr(["ui_menu_file_for_finding_book_by_event"], function(
      data
    ) {
      var cmd = data["ui_menu_file_for_finding_book_by_event"];
      SCWeb.core.Main.doCommand(cmd, [allEventsNode], function(result) {
        if (result.question != undefined) {
          SCWeb.ui.WindowManager.appendHistoryItem(result.question);
        }
      });
    });
  },

  _addToPattern: function(pattern, addr) {
    window.scHelper
      .checkEdge(pattern, sc_type_arc_pos_const_perm, addr)
      .fail(function() {
        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, pattern, addr);
      });
  },

  _addNewParam: function(divId) {
    var container = $("#" + divId);
    SCWeb.core.Server.resolveScAddr(["literary_event"], function(keynodes) {
      var literary_event_addr = keynodes["literary_event"];
      window.sctpClient
        .iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, [
          literary_event_addr,
          sc_type_arc_pos_const_perm | sc_type_const,
          sc_type_node
        ])
        .done(function(events) {
          var events_addr = events.map(event => event[2]);
          SCWeb.core.Server.resolveIdentifiers(events_addr, function(keynodes) {
            var event_types_name = [];
            var strProm = '<select id ="event_type">';
            for (var i = 0; i <= events_addr.length - 1; i++) {
              event_types_name[i] = keynodes[events_addr[i]];
              strProm += '<option value="' + events_addr[i];
              strProm += '">' + event_types_name[i] + "</option>";
            }
            strProm += "</select>";

            container.append(strProm);
          });
        });
    });
  },

  /*добавление нового события*/
  _addNewInfo: function(containerId) {
    var container = $("#" + containerId);
    console.log("add new event");
    if (patternIsCreated) {
      $("#event_type").remove();
      eventsNumber++;
      console.log(eventsNumber);
    } else
      alert("Необходимо сформировать шаблон, иначе данные будут потеряны!");
  },
  /*формирование шаблона*/
  _createNewPattern: function(allInfoNode) {
    var self = this;

    self._addToPattern(allInfoNode, $("#event_type option:selected").val());
    console.log("everything is okey. Pattern was created");

    patternIsCreated = true;
    eventsNumber++;
  }
};

