import { Component } from '@angular/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import { saveAs } from 'file-saver';
const Hebcal = require('hebcal');
import {endOfWeek, format, addMinutes} from 'date-fns';
import Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  zemanim: any;
  constructor() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        const shabatDate = endOfWeek(new Date());
        const hDate = new Hebcal.HDate(shabatDate);
        hDate.setLocation(latitude, longitude);
        this.zemanim = hDate.getZemanim();
      });
    } else {
      console.log('No support for geolocation');
    }
  }

  title = 'zmanim';
  example1 = '{shkiah}';
  example2 = '{shkiah + 20}';
  dropped(files: NgxFileDropEntry[]) {
    const options = {
      parser: (tag: string) => {
        return {
          get: (scope: any) => {
            // scope will be {user: "John"}
            if (tag === '.') {
              return scope;
            }
            else {
              const arr = tag.split(/[+-]/g);
              const action = tag.split('').find(l => ['-', '+'].includes(l));
              // tslint:disable-next-line:no-non-null-assertion
              const keyIndex = arr.findIndex(a => Object.keys(this.zemanim).includes(a))!;
              const date = scope[arr[keyIndex]];
              if (arr.length === 1){
                return format(date, 'HH:MM');
              }
              const addMinutesCount = +(action + (keyIndex === 0 ? arr[1] : arr[0]));
              return format(addMinutes(date, addMinutesCount), 'HH:MM');
            }
          }
        };
      },
    };


    (files[0].fileEntry as FileSystemFileEntry).file(async file => {
      const reader = new FileReader();
      reader.onload = async e => {
        const zip = await new PizZip();
        // tslint:disable-next-line:no-non-null-assertiondw
        zip.load(reader.result!);
        const doc = new Docxtemplater(zip, options);
        doc.setData(this.zemanim);
        try {
          doc.render();
        } catch (error) {
          throw error;
        }

        const out = doc.getZip().generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }); // Output the document using Data-URI
        saveAs(out, 'output.docx');
      };
      reader.readAsArrayBuffer(file as Blob);
    });
  }
}
