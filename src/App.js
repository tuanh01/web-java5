import "./App.css";
import React, { useEffect, useRef,useState } from "react";
import {Howl, Howler} from 'howler';
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';
import soundURL from './assets/hihi.mp3';
import { initNotifications, notify } from '@mycv/f8-notification';

var sound = new Howl({
  src: [soundURL]
});



const NOT_TOUCH_LABEL = "not_touch";
const TOUCHED_LABEL = "touched";
const TRAINING_TIMES = 50;
const TOUCHED_CONFIDENCE =0.8;

function App() {
  const video = useRef();
  const classifier = useRef();
  const canPlaySound = useRef(true);
  const mobilenetModule = useRef();

const[touched,setTouched]=useState(false);

  const init = async () => {
    console.log('init ...');
    await setupCamera();

    console.log('setupcamera');
    //load DB
    classifier.current = knnClassifier.create();
    mobilenetModule.current = await mobilenet.load();

    console.log('setup done');
    console.log('không chạm tay lên mặt và bấm train 1');

    initNotifications({ cooldown: 3000 });
  };

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          { video: true },
          stream => {
            video.current.srcObject = stream;
            video.current.addEventListener('loadeddata', resolve);
          },
          error => reject(error)
        );
      } else {
        reject();
      }
    });
  };

  const train = async label => {
    console.log(`[${label}] Đang train cho máy mặt đẹp trai của ban...`);
    for (let i = 0; i < TRAINING_TIMES; ++i) {
      console.log(`Progress  ${parseInt((i + 1) / TRAINING_TIMES * 100)}%`);
      await training(label);
    }
  };
/**
 * Bước 1:train cho máy khuôn mặt không chạm tay
 * Bước 2:Train cho máy khuôn mặt có chạm tay
 * Bước 3:lấy hình ảnh hiện tại,phân tích và so sánh với data đã học trước đó
 * ==>nếu mà matching với data khuôn mặt chạm tay ==> Cảnh báo
 * 
 */


  const training = label=>{
    return new Promise (async resolve => {
const embedding = mobilenetModule.current.infer(
video.current,
true
);
classifier.current.addExample(embedding,label);
await sleep(100);
resolve();
    });
  }

const run = async ()=>{
  const embedding = mobilenetModule.current.infer(
    video.current,
    true
    );
  const result = await classifier.current.predictClass(embedding);
  // console.log('Label:',result.label);
  // console.log('Label:',result.confidences);

  if(
    result.label === TOUCHED_LABEL &&
    result.confidences[result.label]> TOUCHED_CONFIDENCE
    
    ){
      console.log('Touched');
      if(canPlaySound.current){
        canPlaySound.current =false;
        sound.play();
      }
      sound.play();
      notify('Bỏ Tay ra', { body: 'Bạn vừa chạm tay vào mặt!' });
      setTouched(true);
  }else{
    console.log('Not Touched');
    setTouched(false);
  }

  await sleep(200);
  run();
}

  const sleep =(ms = 0)=>{
    return new Promise(resolve => setTimeout(resolve, ms))

  }
  useEffect(() => {
    init();
sound.on('end',function(){

  canPlaySound.current =true;
  console.log('finished!');
});
    //cleanup
    return () => {

    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    
    <div className={`main ${touched ?'touched' : ''}`}>
      <video ref={video} className="video" autoPlay />
      <div className="control">
        <button className="btn tran1" onClick={() => train(NOT_TOUCH_LABEL)}>
          Train 1
        </button>
        <button className="btn tran2" onClick={() => train(TOUCHED_LABEL)}>
          Train 2
        </button>
        <button className="btn tran3" onClick={() => run()}>
          Run
        </button>
      </div>
      <div className='content'>
        <h1>App Tú Anh </h1>
      </div>
    </div>
  );
}

export default App;
