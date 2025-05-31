"use client";

import { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

const padZero = (num) => num.toString().padStart(2, "0");

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
  });

  useEffect(() => {
    if (!endTime) return;

    const endTimeDate = new Date(endTime);
    if (isNaN(endTimeDate.getTime())) {
      setTimeLeft((prev) => ({ ...prev, ended: true }));
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endTimeDate.getTime() - now.getTime();

      let newTimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        ended: false,
      };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          ended: false,
        };
      } else {
        newTimeLeft.ended = true;
      }
      return newTimeLeft;
    };

    setTimeLeft(calculateTimeLeft());

    const timerInterval = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft();
      setTimeLeft(updatedTimeLeft);

      if (updatedTimeLeft.ended) {
        clearInterval(timerInterval);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [endTime]);

  return (
    <div className="fixed top-20 right-6 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
        <FiClock className="text-blue-500" size={18} />
        <span className="font-semibold text-sm">Time Left:</span>
        {timeLeft.ended ? (
          <span className="text-red-500 font-bold text-sm ml-1">Ended</span>
        ) : (
          <div className="flex items-center gap-1 font-mono text-sm font-medium tracking-wider ml-1">
            {timeLeft.days > 0 && (
              <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                {padZero(timeLeft.days)}
              </span>
            )}
            {timeLeft.days > 0 && <span className="text-gray-500">:</span>}

            <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {padZero(timeLeft.hours)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">:</span>
            <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {padZero(timeLeft.minutes)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">:</span>
            <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded">
              {padZero(timeLeft.seconds)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;
