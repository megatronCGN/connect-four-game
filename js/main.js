(function() {
  "use strict";

  function VG(el, options) {
    this.$el = el;
    this.options = $.extend(this.options, options);
    this.player1 = 'red';
    this.player2 = 'blue';
    this.activePlayer = this.player1;
    this.winnerCellClass = 'winner-cell';
    this._init();
  }

  VG.prototype.options = {
    colCount: 7,
    cellCount: 6,
    toWinCount: 4
  };

  VG.prototype._init = function () {
    this._buildBoard();
    this._initEvents();
    this._message(this.player1 + ' Player begins');
    this.$el.addClass(this.activePlayer);
  };

  // Baut das Spielbrett
  VG.prototype._buildBoard = function () {
    if (this.board) {
      this.board.$cells.removeClass(this.player1 + ' ' + this.player2);
      return;
    }

    this.$el.addClass('vg');
    this.board = [];
    this.board.$cells = $();

    for (var i = 0; i < this.options.colCount; i++) {
      var currentCol = 'col-' + i;

      this.board.push({});
      this.board[i].$el = $('<button class="vg__col" id="'+ currentCol +'"></button>').appendTo(this.$el);
      this.board[i].cells = [];

      for (var idx = 0; idx < this.options.cellCount; idx++) {
        var currentRow = 'cell-' + i + '-' + idx;
        this.board[i].cells[idx] = $('<span class="vg__cell" data-col="'+ i +'" data-row="'+ idx +'">'+ currentRow +'</span>').appendTo(this.board[i].$el);
        this.board.$cells = this.board.$cells.add(this.board[i].cells[idx]);
      }
    }
    this.board.$messages = $('<div class="vg-messages"></div>').insertAfter(this.$el);
  };

  // Mache einen Spielzug
  VG.prototype._resolveTurn = function(currentCol) {
    var currentCell = this._fillLastCell(currentCol);
    var adjacentCells = this._findAdjacentCells(currentCell);
    var matchingCells = this._findMatchingCells(adjacentCells);

    if (matchingCells.winCount >= this.options.toWinCount ) {
      this._finishGame(matchingCells.winCells);
    }
    else {
      if (this.activePlayer === this.player1) {
        this.activePlayer = this.player2;
      }
      else {
        this.activePlayer = this.player1;
      }
      this.$el.removeClass(this.player1).removeClass(this.player2);
      this.$el.addClass(this.activePlayer);
      this._message(this.activePlayer + ' Players Turn');
    }
  };

  // Finde die letzte unbesetzte Zelle einer Spalte
  VG.prototype._fillLastCell = function (col) {
    var that = this;
    var currentCell;

    // Iteriere in umgekehrter Reihenfolge, da wir von unten nach oben gehen
    $.each(col.cells.reverse(), function(i, cell) {
      if (!cell.hasClass(that.player1) && !cell.hasClass(that.player2)) {
        currentCell = cell;

        cell.addClass(that.activePlayer);

        // Ursprüngliche Reihenfolge vor verlassen des Loops
        col.cells.reverse();
        return false;
      }
    });

    return currentCell;
  };

  // Finde "benachbarten" Zellen der aktuellen Zelle zur Auswertung des Zugs
  VG.prototype._findAdjacentCells = function(cell){
    var that = this;

    if (!cell) return;

    var colNr = this._getColNr(cell);
    var rowNr = this._getRowNr(cell);

    return {
      leftToRight: this.board.$cells.filter(function (i, cell) {
        return (that._getRowNr(cell) === rowNr);
      }),
      topToBottom: this.board.$cells.filter(function (i, cell) {
        return (that._getColNr(cell) === colNr);
      }),
      topLeftToBottomRight: this.board.$cells.filter(function (i, cell) {
        return (that._getColNr(cell) - that._getRowNr(cell) === colNr - rowNr);
      }),
      bottomLeftToTopRight: this.board.$cells.filter(function (i, cell) {
        return (that._getColNr(cell) + that._getRowNr(cell) === colNr + rowNr);
      })
    }

  };

  // Finde Farbenreihen in den "benachbarten" Zellen
  VG.prototype._findMatchingCells = function(adjacentCells) {
    var that = this;
    var count = 1;
    var winningCells = [];

    $.each(adjacentCells, function(direction, cells) {
      if (cells.length < that.options.toWinCount) return;

      var $takenCells = $(cells).filter(function (i, cell) {
        return $(cell).hasClass(that.activePlayer);
      });

      if ($takenCells.length >= 4) {
        for (var i = 0; i < $takenCells.length  ; i++) {

          if (i+1 >= $takenCells.length) return;

          // Wenn die Differenz zwischen der aktuellen und der nächsten Zelle der Reihe bzw. Spalte genau 1 beträgt
          // sind die Zellen benachbart und der winCount wird erhöht
          switch (direction) {
            case 'leftToRight':
              if (that._getColNr($takenCells[i + 1]) - that._getColNr($takenCells[i]) === 1) {
                winningCells.push($takenCells[i], $takenCells[i+1]);
                count++;
              } else count = 0;
              break;
            case 'topToBottom':
              if (that._getRowNr($takenCells[i+1]) - that._getRowNr($takenCells[i]) === 1) {
                winningCells.push($takenCells[i], $takenCells[i+1]);
                count++;
              } else count = 0;
              break;
            case 'topLeftToBottomRight':
              if (that._getRowNr($takenCells[i+1]) - that._getRowNr($takenCells[i]) === 1) {
                winningCells.push($takenCells[i], $takenCells[i+1]);
                count++;
              } else count = 0;
              break;
            case 'bottomLeftToTopRight':
              if (that._getRowNr($takenCells[i]) - that._getRowNr($takenCells[i+1]) === 1) {
                winningCells.push($takenCells[i], $takenCells[i+1]);
                count++;
              } else count = 0;
              break;
          }
        }
      }
    });

    return {
      winCount : count,
      winCells : winningCells.filter(function (cell, i) { // Entfernt Duplikate aus den winCells
        return winningCells.indexOf(cell) === i;
      })
    }
  };

  // Finalisiere das Spiel
  VG.prototype._finishGame = function(winningCells) {
    var that = this;

    setTimeout(function () {
      $.each(winningCells, function (i, cell) {
        $(cell).addClass(that.winnerCellClass);
      });
    }, 300);
//    }, parseInt(document.documentElement.style.getPropertyValue('--myVariable')));

    this.$el.removeClass(this.activePlayer);
    this._offEvents();
    this._message(this.activePlayer + ' Player has won! New Game? Click here!');
    this.board.$messages.click(function (e) {
      e.stopPropagation();

      $(this).off('click');
      that.board.$cells.removeClass(that.winnerCellClass);
      that._init();
    });
  };

  // Helper Methods
  VG.prototype._getColNr = function(cell) {
    return parseInt($(cell).attr('data-col'));
  };

  VG.prototype._getRowNr = function(cell) {
    return parseInt($(cell).attr('data-row'));
  };

  VG.prototype._message = function (message) {
    this.board.$messages.text(message);
  };

  // Event Handling
  VG.prototype._initEvents = function () {
    var that = this;

    // Clicks auf Columns
    $.each(this.board, function(i, col){
      col.$el.click(function(){
        $(this).trigger('dropToken.vg', {currentCol : col});
      });
    });

    this.$el.on('dropToken.vg', function (e, data) {
      e.stopPropagation();
      that._resolveTurn(data.currentCol);
    });
  };

  VG.prototype._offEvents = function () {

    $.each(this.board, function(i, col){
      col.$el.off('click');
    });

    this.$el.off('dropToken.vg');
  };

  var vg = new VG($('#vg'), {});
  //var vg2 = new VG($('#vg2'), {});

})();
