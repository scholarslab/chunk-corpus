!function(n){"use strict";zip.workerScriptsPath="/chunk-corpus/scripts/";var t=/[\w'-–—]*\w/g,e=function(n,t,e){for(var r=[n],o=n.length;t>o;)r.push(e),o+=e.length;return r.reverse().join("")},r=function(n,t){var r=/^(.+)\.[^.]*$/,o=n.replace(r,"$1"),a=e(t.toString(),6,"0");return o+"-"+a+".txt"},o=function(n){return n.name=r(n.name,n.contents.start),n},a=function(n){return n.match(t)},l=function(n,t,e){var r=[],o=0;if(n.length<t)r.push(n);else for(;o<=n.length;)r.push({start:o,data:n.slice(o,o+t)}),o+=e;return r},u=function(n){return Bacon.fromCallback(function(t){var e=new FileReader;e.onload=function(e){t({name:n.name,contents:e.target.result})},e.readAsText(n)})},i=function(t,e,r,o){if(r<e.length){var a=e[r];t.add(a.name,new zip.TextReader(a.contents),function(){var a=n("#chunk_progress");i(t,e,r+1,o),a.attr("value",1+parseInt(a.attr("value")))})}else o(t)},c=function(n){return Bacon.fromCallback(function(t){zip.createWriter(new zip.BlobWriter,function(e){i(e,n,0,t)})})},f=function(n){return Bacon.fromCallback(function(t){n.close(t)})},s=function(n){saveAs(n,"corpus-chunks.zip")},p=function(n,t){return function(e){return e[n]=t(e[n]),e}},g=function(n){return function(t){for(var e=t[n].slice(),r=Object.getOwnPropertyNames(t),o=0;o<e.length;o++){for(var a={},l=0;l<r.length;l++){var u=r[l];a[u]=t[u]}a[n]=e[o],e[o]=a}return Bacon.fromArray(e)}},d=function(t,e){return function(r){return Bacon.sequentially(0,r).log("sequentially").filter(function(n){return"text/plain"===n.type}).log("filter (text/plain)").flatMap(u).log("readTextFile").map(p("contents",a)).log("tokenize").map(p("contents",function(r){var o=l(r,t,e),a=n("#chunk_progress");return a.attr("max",o.length+parseInt(a.attr("max"))-1),o})).log("chunk").flatMap(g("contents")).log("spread").map(o).log("updateOutputFileName").map(p("contents",function(n){return n.data.join(" ")})).log("join").fold([],function(n,t){return n.push(t),n}).log("fold").filter(function(n){return n.length>0}).log("filter (empty)").flatMap(c).log("zipAll").flatMap(f)}};n(function(){if(window.File&&window.FileReader&&window.FileList&&window.Blob){var t=n("#input_files"),e=n("#drop_target"),r=parseInt(n("#chunk_size").val()),o=parseInt(n("#chunk_step").val()),a=null,l=null,u=null,i=null;a=t.asEventStream("change"),u=a.flatMap(function(n){return n.target.files}),e.on("dragover",function(n){n.stopPropagation(),n.preventDefault(),n.originalEvent.dataTransfer.dropEffect="copy"}),l=e.asEventStream("drop").doAction(function(n){n.stopPropagation(),n.preventDefault()}),i=l.flatMap(function(n){return n.originalEvent.dataTransfer.files}),Bacon.mergeAll(u,i).log("mergeAll").map(function(t){return n("#progress_modal").openModal(),n("#chunk_progress").attr("max",t.length).attr("value",0),t}).log("progress_modal.openModal").flatMap(d(r,o)).log("zipChunks").onValue(function(t){s(t),n("#progress_modal").closeModal()})}else n("#error_modal").openModal()})}(jQuery);