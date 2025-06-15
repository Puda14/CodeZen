"use client";

import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CubeTransparentIcon,
  SparklesIcon,
  ScaleIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const main = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      const sections = self.selector(".animated-section");
      const featureCards = self.selector(".feature-card");

      // 1. Hero Section Animation
      gsap.fromTo(
        ".hero-element",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.2,
        }
      );

      // 2. Sections Animation on Scroll
      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 100 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 3. Feature Cards Animation on Scroll
      featureCards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, main);
    return () => ctx.revert();
  }, []);

  const features = [
    {
      name: "Create & Host Contests",
      description:
        "Effortlessly build and manage your own programming contests. Customize problems, define rules, and invite participants with our intuitive and powerful tools.",
      icon: DocumentPlusIcon,
    },
    {
      name: "AI-Powered Test Case Generation",
      description:
        "Save hours of manual work. Our AI analyzes your problem statements and automatically generates a comprehensive suite of test cases, from the basics to complex edge cases.",
      icon: SparklesIcon,
    },
    {
      name: "AI-Powered Plagiarism Check",
      description:
        "Ensure a fair and level playing field. Our advanced AI scans code submissions for similarities, providing detailed reports to uphold the integrity of your contests.",
      icon: ScaleIcon,
    },
  ];

  return (
    <div ref={main} className="font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center p-5">
        <div className="max-w-4xl">
          <h1 className="hero-element text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500">
            Welcome to CodeZen
          </h1>
          <p className="hero-element mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300">
            The ultimate platform for competitive programming. Host, compete,
            and innovate with the power of AI.
          </p>
          <div className="hero-element mt-8">
            <a
              href="/contests"
              className="inline-block px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Explore Contests
            </a>
          </div>
        </div>
      </section>

      {/* Mindset Section */}
      <section className="animated-section container mx-auto py-20 md:py-32 px-5 text-center">
        <div className="max-w-3xl mx-auto">
          <CubeTransparentIcon className="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Our Mindset
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            We believe in the power of code to solve problems and drive
            innovation. CodeZen is designed to be a clean, efficient, and
            powerful environment where developers can hone their skills,
            compete, and learn. Our focus is on providing a seamless experience,
            so you can focus on what matters most: the code.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="animated-section bg-gray-50 dark:bg-gray-950/70 py-20 md:py-32 px-5">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              A New Era of Competitive Programming
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
              We provide everything you need to run successful events, powered
              by cutting-edge AI.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="feature-card flex flex-col bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50"
              >
                <div className="flex-shrink-0">
                  <feature.icon
                    className="h-10 w-10 text-blue-600 dark:text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 flex-grow">
                  <h3 className="text-xl font-semibold">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-gray-200 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} CodeZen. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
