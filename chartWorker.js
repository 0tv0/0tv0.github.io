var chart = [];
var startTime = 0;
var readableZone = 500;

this.onmessage = ({ data }) => {
  if(data.type === 'get') {
    let playthroughMs = Date.now() - startTime;

    let inRangeNotes = [];
    for(let i in chart) {
      let dist = Math.abs(playthroughMs - chart[i].startTime);
      if(dist <= readableZone) inRangeNotes.push(chart[i]);
    };
    
    let notes = inRangeNotes.map(x => {
      return {
        ...x,
        offset: Math.abs(x.startTime - playthroughMs),
        scroll: ((x.startTime - playthroughMs) / readableZone),
        holdScroll: (((x.startTime - playthroughMs) + x.holdTime) / readableZone)
      };
    });

    this.postMessage({
      type: 'get',
      message: 'success',
      asyncRequestID: data.asyncRequestID,
      notes
    });
  } else if(data.type === 'begin') {
    startTime = Date.now();
    this.postMessage({
      type: 'chart',
      message: 'success',
      asyncRequestID: data.asyncRequestID
    });
  } else if(data.type === 'chart') {
    fetch(data.url).then(x => x.json()).then(x => {
      let info = {
        sectionsParsed: 0,
        notesParsed: 0
      };
      
      x.song.notes.forEach(section => {
        info.sectionsParsed++;
        section.sectionNotes.forEach(c => {
          info.notesParsed++;
          let playing = c[1] > 3;
          if(section.mustHitSection) playing = !playing;
          
          chart.push({
            startTime: c[0],
            holdTime: c[2],
            arrow: c[1] % 4,
            playing,
            noteid: Math.floor(Math.random() * 36 ** 10).toString(36).padStart(10, '0')
          });
        });
      });
      
      console.log(info, chart);
      
      this.postMessage({
        type: 'chart',
        message: 'success',
        asyncRequestID: data.asyncRequestID
      });
    }).catch(err => {
      this.postMessage({
        type: 'chart',
        message: 'failed',
        asyncRequestID: data.asyncRequestID,
        error: err.message
      });
    });
  } else if(data.type === 'screentime') {
    readableZone = data.value;
  } else if(data.type === 'length') {
    let length = 0;
    for(let i in chart) length = Math.max(length, chart[i].startTime + 1000);
    this.postMessage({
      type: 'length',
      message: 'success',
      asyncRequestID: data.asyncRequestID,
      length
    })
  }
}
