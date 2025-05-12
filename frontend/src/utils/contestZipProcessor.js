import JSZip from "jszip";
import { Difficulty } from "@/enums/difficulty.enum";
import { Tags } from "@/enums/tags.enum";
import {
  submissionLimits,
  testcaseTimeoutLimits,
  testcaseScoreLimits,
} from "@/config/contestConfig";

export const processContestZip = async (file, defaultProblemContent) => {
  const zip = new JSZip();
  const parsedData = {
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    isPublic: true,
    leaderboardStatus: "open",
    problems: [],
  };

  try {
    const loadedZip = await zip.loadAsync(file);

    const contestJsonFile = loadedZip.file(/contest\.json$/i)[0];
    if (contestJsonFile) {
      const content = await contestJsonFile.async("string");
      const contestConfig = JSON.parse(content);
      parsedData.title =
        contestConfig.title || file.name.replace(/\.zip$/i, "") || "";
      parsedData.description = contestConfig.description || "";
      const timeFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
      if (
        contestConfig.start_time &&
        typeof contestConfig.start_time === "string"
      ) {
        if (timeFormatRegex.test(contestConfig.start_time)) {
          parsedData.startTime = contestConfig.start_time.slice(0, 16);
        } else {
          console.warn(
            `Invalid start_time format in contest.json: "${contestConfig.start_time}". Expected YYYY-MM-DDTHH:MM(:SS) local time.`
          );
        }
      }
      if (
        contestConfig.end_time &&
        typeof contestConfig.end_time === "string"
      ) {
        if (timeFormatRegex.test(contestConfig.end_time)) {
          parsedData.endTime = contestConfig.end_time.slice(0, 16);
        } else {
          console.warn(
            `Invalid end_time format in contest.json: "${contestConfig.end_time}". Expected YYYY-MM-DDTHH:MM(:SS) local time.`
          );
        }
      }
      parsedData.isPublic =
        typeof contestConfig.isPublic === "boolean"
          ? contestConfig.isPublic
          : true;
      parsedData.leaderboardStatus = ["open", "frozen", "closed"].includes(
        contestConfig.leaderboardStatus
      )
        ? contestConfig.leaderboardStatus
        : "open";
    } else {
      parsedData.title = file.name.replace(/\.zip$/i, "");
    }

    const problemMdFiles = loadedZip.file(
      /^(?:[^/]+\/)*([^/]+)\/problem\.md$/i
    );

    const problemPromises = problemMdFiles.map(async (problemMdFileEntry) => {
      const fullPath = problemMdFileEntry.name;
      const problemDir = fullPath.substring(0, fullPath.lastIndexOf("/") + 1);
      const problemFolderName = problemDir.split("/").filter(Boolean).pop();

      const problem = {
        name: problemFolderName,
        content: defaultProblemContent,
        difficulty: Difficulty.NORMAL,
        tags: [],
        maxSubmissions: submissionLimits.default,
        testcases: [],
      };

      problem.content = await problemMdFileEntry.async("string");

      const problemConfigFile = loadedZip.file(`${problemDir}config.json`);
      if (problemConfigFile) {
        try {
          const configContent = await problemConfigFile.async("string");
          const pConfig = JSON.parse(configContent);
          problem.name = pConfig.name || problem.name;
          problem.difficulty = Object.values(Difficulty).includes(
            pConfig.difficulty
          )
            ? pConfig.difficulty
            : Difficulty.NORMAL;

          if (Array.isArray(pConfig.tags)) {
            problem.tags = pConfig.tags
              .map((tagFromFile) => {
                if (typeof tagFromFile !== "string") return null;

                const enumKeys = Object.keys(Tags);
                const matchingKey = enumKeys.find(
                  (key) => key.toLowerCase() === tagFromFile.toLowerCase()
                );
                if (matchingKey) {
                  return matchingKey;
                }

                for (const key in Tags) {
                  if (Tags[key].toLowerCase() === tagFromFile.toLowerCase()) {
                    return key;
                  }
                }

                console.warn(
                  `Tag "${tagFromFile}" from config.json for problem "${problem.name}" not found in Tags enum. Skipping.`
                );
                return null;
              })
              .filter(Boolean);
          }

          problem.maxSubmissions =
            typeof pConfig.maxSubmissions === "number" &&
            pConfig.maxSubmissions >= submissionLimits.min &&
            pConfig.maxSubmissions <= submissionLimits.max
              ? pConfig.maxSubmissions
              : submissionLimits.default;
        } catch (e) {
          console.warn(
            `Could not parse config.json for problem ${problem.name}: ${e.message}`
          );
        }
      }

      const testcaseBaseDir = `${problemDir}testcases/`;
      const testcaseFolderEntries = [];
      loadedZip.folder(testcaseBaseDir)?.forEach((relativePath, entry) => {
        if (entry.dir) {
          const folderName = relativePath.replace(/\/$/, "");
          if (folderName && !folderName.includes("/")) {
            testcaseFolderEntries.push(folderName);
          }
        }
      });

      testcaseFolderEntries.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );

      for (const tcFolderName of testcaseFolderEntries) {
        const currentTcData = {
          input: "",
          output: "",
          score: testcaseScoreLimits.default,
          timeout: testcaseTimeoutLimits.default,
          isPublic: false,
        };
        const inputFile = loadedZip.file(
          `${testcaseBaseDir}${tcFolderName}/input.txt`
        );
        const outputFile = loadedZip.file(
          `${testcaseBaseDir}${tcFolderName}/output.txt`
        );
        const scoreFile = loadedZip.file(
          `${testcaseBaseDir}${tcFolderName}/score.txt`
        );
        const timeoutFile = loadedZip.file(
          `${testcaseBaseDir}${tcFolderName}/timeout.txt`
        );
        const isPublicFile = loadedZip.file(
          `${testcaseBaseDir}${tcFolderName}/is_public.txt`
        );

        if (inputFile) currentTcData.input = await inputFile.async("string");
        if (outputFile) currentTcData.output = await outputFile.async("string");
        if (scoreFile)
          currentTcData.score =
            parseFloat(await scoreFile.async("string")) || 10;
        if (timeoutFile)
          currentTcData.timeout =
            parseInt(await timeoutFile.async("string"), 10) ||
            testcaseTimeoutLimits.default;
        if (isPublicFile)
          currentTcData.isPublic =
            (await isPublicFile.async("string")).toLowerCase() === "true";

        if (currentTcData.input.trim() || currentTcData.output.trim()) {
          problem.testcases.push(currentTcData);
        }
      }
      if (problem.testcases.length === 0) {
        problem.testcases.push({
          input: "",
          output: "",
          score: 10,
          isPublic: true,
          timeout: testcaseTimeoutLimits.default,
        });
      }
      return problem;
    });

    parsedData.problems = await Promise.all(problemPromises);
    return { success: true, data: parsedData };
  } catch (e) {
    console.error("Error processing contest ZIP:", e);
    return {
      success: false,
      error: e.message || "Failed to process ZIP file.",
    };
  }
};
