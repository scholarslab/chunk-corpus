/* global
   jQuery
   Bacon
   zip
   saveAs
 */


(function($) {
  'use strict';

  // TODO: Switch these based on development or production
  // zip.workerScriptsPath = '/chunk-corpus/scripts/';
  zip.workerScriptsPath = '/scripts/';

  var tokenRegex = /[\w'-–—]*\w/g;

  var padLeft = function(string, width, padChar) {
    var paddingArray = [string],
        size = string.length;

    while (size < width) {
      paddingArray.push(padChar);
      size += padChar.length;
    }

    return paddingArray.reverse().join('');
  };

  var outputFileName = function(file, tokenStart) {
    var refilename = /^(.+)\.[^.]*$/,
        base = file.replace(refilename, '$1'),
        offset = padLeft(tokenStart.toString(), 6, '0');

    return base + '-' + offset + '.txt';
  };

  var updateOutputFileName = function(fileChunk) {
    fileChunk.name = outputFileName(fileChunk.name, fileChunk.contents.start);
    return fileChunk;
  };

  var tokenize = function(dataStr) {
    return dataStr.match(tokenRegex);
  };

  // return { start: ...., data: .... }
  var chunk = function(xs, size, step) {

    var output = [],
        i = 0,
        stepInt = +step,
        sizeInt = +size;

    if (xs.length < sizeInt) {
      output.push(xs);
    } else {
      while (i <= xs.length) {
        output.push({
          start: i,
          data: xs.slice(i, i + sizeInt)
        });
        i += stepInt;
      }
    }

    return output;
  };

  var readTextFile = function(f) {
    return Bacon.fromCallback(function(callback) {
      var reader = new FileReader();
      reader.onload = function(evt) {
        callback({
          name: f.name,
          contents: evt.target.result
        });
      };
      reader.readAsText(f);
    });
  };

  var zipAdd = function(writer, files, i, k) {
    if (i < files.length) {
      var f = files[i];
      writer.add(f.name, new zip.TextReader(f.contents), function() {
        var progress = $('#chunk_progress');
        zipAdd(writer, files, i + 1, k);
        progress
          .attr('value', 1 + parseInt(progress.attr('value')));
      });
    } else {
      k(writer);
    }
  };

  var zipAll = function(files) {
    return Bacon.fromCallback(function(callback) {
      zip.createWriter(new zip.BlobWriter(), function(writer) {
        zipAdd(writer, files, 0, callback);
      }, function(error) { console.log(error); });
    });
  };

  var finis = function(z) {
    return Bacon.fromCallback(function(callback) {
      z.close(callback);
    });
  };

  var saveZip = function(blob) {
    saveAs(blob, 'corpus-chunks.zip');
  };

  var over = function(property, f) {
    return function(x) {
      x[property] = f(x[property]);
      return x;
    };
  };

  var spread = function(property) {
    return function(x) {
      var xs = x[property].slice(),
          names = Object.getOwnPropertyNames(x);

      for (var i = 0; i < xs.length; i++) {
        var y = {};

        for (var j = 0; j < names.length; j++) {
          var n = names[j];
          y[n] = x[n];
        }

        y[property] = xs[i];
        xs[i] = y;
      }

      return Bacon.fromArray(xs);
    };
  };

  var zipChunks = function(size, step, files) {
    return Bacon.sequentially(0, files)
      .filter(function(f) { return f.type === 'text/plain'; })
      .flatMap(readTextFile)
      .map(over('contents', tokenize))
      .map(over('contents', function(tokens) {
        var chunks = chunk(tokens, size, step);
        var progress = $('#chunk_progress');
        progress
          .attr('max', chunks.length + parseInt(progress.attr('max')) - 1);
        return chunks;
      }))
      .flatMap(spread('contents'))
      .map(updateOutputFileName)
      .map(over('contents', function(c) { return c.data.join(' '); }))
      .fold([], function(a, f) { a.push(f); return a; })
      .filter(function(xs) { return xs.length > 0; })
      .flatMap(zipAll)
      .flatMap(finis);
  };

  var numberProperty = function(element) {
    return element
      .asEventStream('change')
      .map(function(evt) {
        return parseInt(evt.target.value);
      })
      .filter(function(v) { return !isNaN(v); })
      .toProperty(element.val());
  };

  $(function() {

    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var fileInput = $('#input_files'),
          dropTarget = $('#drop_target'),
          done = null,
          size = null,
          step = null,
          change = null,
          drop = null,
          inputFiles = null,
          dropFiles = null;

      size = numberProperty($('#chunk_size'));
      step = numberProperty($('#chunk_step'));

      done = dropTarget
        .asEventStream('done')
        .map(function() {
          return [];
        });

      change = fileInput.asEventStream('change');
      inputFiles = change.flatMap(function(evt) {
        return evt.target.files;
      });

      dropTarget.on('dragover', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.originalEvent.dataTransfer.dropEffect = 'copy';
      });
      drop = dropTarget
        .asEventStream('drop')
        .doAction(function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
        });
      dropFiles = drop.flatMap(function(evt) {
        return evt.originalEvent.dataTransfer.files;
      });

      var fileProgress = Bacon.mergeAll(inputFiles, dropFiles, done)
        .map(function(v) {
          if (v.length > 0) {
            $('#progress_modal').openModal();
            $('#chunk_progress')
              .attr('max', v.length)
              .attr('value', 0);
          }
          return v;
        });

      Bacon.combineWith(zipChunks, size, step, fileProgress)
        .flatMap(function(x) { return x; })
        .onValue(function(z) {
          saveZip(z);
          $('#progress_modal').closeModal();
          dropTarget.trigger($.Event('done'));

        });

    } else {
      $('#error_modal').openModal();
    }

  });

})(jQuery);
