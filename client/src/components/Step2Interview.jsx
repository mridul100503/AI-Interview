import React, { useState, useRef, useEffect } from 'react'
import maleVideo from '../assets/Videos/male-ai.mp4'
import femaleVideo from '../assets/Videos/female-ai.mp4'
import Timer from './Timer'
import axios from "axios"
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import { BsArrowRight } from 'react-icons/bs'
import { ServerUrl } from "../App.jsx"
import { createDeepgramMicTranscriber } from '../config/Deepgram_config.js'

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions, userName } = interviewData
  const [isIntroPhase, setIsIntroPhase] = useState(true)
  const [isMicOn, setIsMicOn] = useState(false)
  const deepgramTranscriberRef = useRef(null);
  const isStartingMicRef = useRef(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false)
  const [aiSpeechText, setAiSpeechText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [interimAnswer, setInterimAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const videoRef = useRef(null)
  const answerRef = useRef(null)
  const answerTextRef = useRef("")
  const interimAnswerRef = useRef("")
  const lastNonEmptyAnswerRef = useRef("")
  const isMicOnRef = useRef(false)
  const isAIPlayingRef = useRef(false)
  const isSubmittingRef = useRef(false)
  const shouldOpenMicAfterAISpeechRef = useRef(false)
  const currentQuestion = questions[currentIndex]
  const buildVisibleAnswer = (finalText, interimText) =>
    `${finalText}${interimText ? `${finalText ? " " : ""}${interimText}` : ""}`;
  const visibleAnswer = buildVisibleAnswer(answer, interimAnswer);
  const emptyAnswerFeedback = "You did not submit an answer";
  const getLatestVisibleAnswer = () =>
    buildVisibleAnswer(answerTextRef.current, interimAnswerRef.current);
  const rememberAnswer = (text) => {
    const cleanText = text.replace(/\s+/g, " ").trim();
    if (cleanText) {
      lastNonEmptyAnswerRef.current = cleanText;
    }
    return cleanText;
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const setMicActive = (isActive) => {
    isMicOnRef.current = isActive;
    setIsMicOn(isActive);
  };

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn])

  useEffect(() => {
    isAIPlayingRef.current = isAIPlaying;
  }, [isAIPlaying])

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female")
      );
      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }
      const maleVoice = voices.find(v =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("male")
      );
      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }
      setSelectedVoice(voices[0]);
      setVoiceGender("female")

    };
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [])

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;

  const speakText = (text, { openMicAfter = false } = {}) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        if (openMicAfter) {
          setMicActive(true);
          void startMic().then((didStart) => {
            if (!didStart) setMicActive(false);
          });
        }
        resolve();
        return;
      }
      
      window.speechSynthesis.cancel();
      const shouldOpenMicAfterSpeech = openMicAfter || isMicOnRef.current;

      const humanText = text.replace(/,/g, " ").replace(/\./g, " ");
      const utterance = new SpeechSynthesisUtterance(humanText)
      utterance.voice = selectedVoice;

      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        isAIPlayingRef.current = true;
        setIsAIPlaying(true);
        setAiSpeechText(text);
        shouldOpenMicAfterAISpeechRef.current = shouldOpenMicAfterSpeech;
        setMicActive(false);
        stopMic()
        videoRef.current?.play();
      }
      utterance.onend = () => {
        videoRef.current?.pause();
        videoRef.current.currentTime = 0;
        isAIPlayingRef.current = false;
        setIsAIPlaying(false);

        if (shouldOpenMicAfterAISpeechRef.current) {
          shouldOpenMicAfterAISpeechRef.current = false;
          setMicActive(true);
          void startMic().then((didStart) => {
            if (!didStart) setMicActive(false);
          });
        }

        setTimeout(() => {
          setAiSpeechText("");
          resolve();
        }, 300);
      }
      window.speechSynthesis.speak(utterance);

    })

  }

  useEffect(() => {
    if (!selectedVoice) {
      return;
    }
    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
        );
        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        )
        setIsIntroPhase(false)
      } else if (currentQuestion) {
        await new Promise(r => setTimeout(r, 800));

        if (currentIndex === questions.length - 1) {
          await speakText("Alright,this one might be a bit more challenging")
        }
        await speakText(currentQuestion.question, { openMicAfter: true });
      }
    }
    runIntro()

  }, [selectedVoice, isIntroPhase, currentIndex])
  useEffect(() => {
    if (isIntroPhase) {
      return
    }
    if (!currentQuestion) {
      return;
    }
    if (isSubmitting) {
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0;
        }
        return prev - 1;

      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isIntroPhase, currentIndex, isSubmitting])


  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex])
  useEffect(() => {
    deepgramTranscriberRef.current = createDeepgramMicTranscriber({
      onFinalTranscript: (transcript) => {
        setAnswer((prev) => {
          const nextAnswer = `${prev} ${transcript}`.replace(/\s+/g, " ").trimStart();
          answerTextRef.current = nextAnswer;
          rememberAnswer(nextAnswer);
          return nextAnswer;
        });
        interimAnswerRef.current = "";
        setInterimAnswer("");
      },
      onInterimTranscript: (transcript) => {
        interimAnswerRef.current = transcript;
        setInterimAnswer(transcript);
        rememberAnswer(getLatestVisibleAnswer());
      },
      onError: (error) => {
        console.log("Deepgram mic error:", error);
        setMicActive(false);
      },
      onClose: () => {
        if (isMicOnRef.current && !isAIPlayingRef.current && !isSubmitting) {
          void startMic();
        }
      },
    });

    return () => {
      deepgramTranscriberRef.current?.stop();
    }
  }, [])

  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer, interimAnswer])
  const startMic = async () => {
    if (!deepgramTranscriberRef.current || isAIPlayingRef.current || isStartingMicRef.current) {
      return false;
    }

    try {
      isStartingMicRef.current = true;
      await deepgramTranscriberRef.current.start();
      return true;
    } catch (error) {
      console.log("Unable to start Deepgram mic:", error);
      isMicOnRef.current = false;
      setIsMicOn(false);
      return false;
    } finally {
      isStartingMicRef.current = false;
    }
  }
  const stopMic = () => {
    deepgramTranscriberRef.current?.stop()
  }
  const toggleMic = async () => {
    if (isMicOn) {
      stopMic();
      setMicActive(false)
    } else {
      if (isAIPlayingRef.current) {
        shouldOpenMicAfterAISpeechRef.current = true;
        return;
      }
      setMicActive(true)
      const didStart = await startMic();
      if (!didStart) {
        setMicActive(false);
      }
    }
  }
  const submitAnswer = async () => {
    if (isSubmittingRef.current) {
      return
    }
    isSubmittingRef.current = true;
    const answerBeforeStop = rememberAnswer(getLatestVisibleAnswer());
    setMicActive(false);
    stopMic();
    setIsSubmitting(true)
    await wait(600);
    const submittedAnswer =
      rememberAnswer(getLatestVisibleAnswer()) || answerBeforeStop || lastNonEmptyAnswerRef.current;
    try {
      const result = await axios.post(ServerUrl + "/api/interview/submit-answer", {
        interviewId,
        questionIndex: currentIndex,
        answer: submittedAnswer,
        timeTaken: currentQuestion.timeLimit - timeLeft,
      }, { withCredentials: true })
      setAnswer(submittedAnswer)
      answerTextRef.current = submittedAnswer;
      setInterimAnswer("")
      interimAnswerRef.current = "";
      const responseFeedback = result.data.feedback || "";
      const safeFeedback =
        submittedAnswer && responseFeedback.trim().toLowerCase() === emptyAnswerFeedback.toLowerCase()
          ? "Your answer was submitted successfully. Let's move to the next question."
          : responseFeedback;
      setFeedback(safeFeedback)
      await speakText(safeFeedback)
      setIsSubmitting(false)
      isSubmittingRef.current = false;
    } catch (error) {
      console.log(error);
      setIsSubmitting(false)
      isSubmittingRef.current = false;
    }
  }
  const handleNext = async () => {
    setAnswer("");
    answerTextRef.current = "";
    setInterimAnswer("");
    interimAnswerRef.current = "";
    lastNonEmptyAnswerRef.current = "";
    setFeedback("")

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }
    await speakText("Alright,let's move to the next questions")
    setCurrentIndex(currentIndex + 1);

  }
  const finishInterview = async () => {
    stopMic()
    setMicActive(false)
    try {
      const result = await axios.post(ServerUrl + "/api/interview/finish", {
        interviewId
      }, { withCredentials: true })
      console.log(result.data)
      onFinish(result.data)
    } catch (error) {
      console.log(error)
    }

  }

  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;
    if (timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer();
    }
  }, [timeLeft])

  useEffect(() => {
    return () => {
      isSubmittingRef.current = false;
      deepgramTranscriberRef.current?.stop();
      window.speechSynthesis.cancel()
    }
  }, [])


  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6'>
      <div className='w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden'>
        {/*video section*/}
        <div className='w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200'>
          <div className='w-full max-w-md rounded-xl overflow-hidden shadow-xl'>
            <video src={videoSource} key={videoSource} ref={videoRef} muted playsInline preload='auto' className='w-full h-auto object-cover' />
          </div>
          {aiSpeechText && (
            <div className='w-full max-w-md bg-emerald-50 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm'>
              <p className='text-xs sm:text-sm text-emerald-500 mb-2'>
                AI is saying
              </p>
              <p className='text-base sm:text-lg font-semibold text-gray-800 leading-relaxed'>
                {aiSpeechText}
              </p>
            </div>
          )}
          {/* timer area*/}
          <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-200'>
                InterviewStatus
              </span>
              {isAIPlaying && <span className='text-sm font-semibold text-emerald-600'>
                {isAIPlaying ? "AI Speaking" : ""}</span>}
            </div>
            <div className='h-px bg-gray-200'></div>
            <div className='flex justify-center'>
              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit} />
            </div>
            <div className='h-px bg-gray-200'></div>
            <div className='grid grid-cols-2 gap-6 text-center'>
              <div>
                <span className='text-2xl font-bold text-emerald-600'>{currentIndex + 1}</span>
                <span className='text-xs text-gray-400' >Current Question</span>
              </div>
              <div>
                <span className='text-2xl font-bold text-emerald-600'>{questions.length}</span>
                <span className='text-xs text-gray-400'>Total questions</span>
              </div>
            </div>
          </div>
        </div>
        {/*Text section8*/}
        <div className='flex-1 min-h-0 flex flex-col p-4 sm:p-6 md:p-8 relative'>
          <h2 className='text-xl sm:text-2xl font-bold text-emerald-600 mb-6'>
            Ai Smart Interview
          </h2>
         
          {!isIntroPhase && (<div className='relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm'>
            <p className='text-xs sm:text-sm text-gray-400 mb-2'>
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className='text-base sm:text-lg font-semibold text-gray-800 leading-relaxed'>{currentQuestion?.question}</div>
          </div>)
          }
          <textarea
            ref={answerRef}
            placeholder={isMicOn ? "Speak now, your answer will appear here..." : "Type your answer here..."}
            onChange={(e) => {
              setAnswer(e.target.value);
              answerTextRef.current = e.target.value;
              rememberAnswer(e.target.value);
              setInterimAnswer("");
              interimAnswerRef.current = "";
            }}
            value={visibleAnswer}
            className='flex-1 min-h-[260px] lg:min-h-0 max-h-[46vh] lg:max-h-none bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800 leading-relaxed overflow-y-auto'
          />
          {!feedback ? (<div className='flex items-center gap-4 mt-6' >
            <motion.button
              onClick={toggleMic}
              whileTap={{ scale: 0.9 }}
              className='w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-black text-white shadow-lg'
            >
              {isMicOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </motion.button>
            <motion.button
              onClick={submitAnswer}
              disabled={isSubmitting}
              whileTap={{ scale: 0.95 }}
              className='flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:bg-gray-500'>
              {isSubmitting ? "Submitting" : "Submit Answer"}
            </motion.button>
          </div>) : (
            <motion.div
              onClick={handleNext}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm'>
              <p className='text-emerald-700 font-medium mb-4'>{feedback}</p>
              <button className='w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1'>
                Next Question<BsArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Step2Interview
