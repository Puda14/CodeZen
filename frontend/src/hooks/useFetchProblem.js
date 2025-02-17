import { useState, useEffect } from "react";

const useFetchProblem = () => {
  const [problemDescription, setProblemDescription] = useState("");

  useEffect(() => {
    fetch("/test.md")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load problem description: ${response.status}`
          );
        }
        return response.text();
      })
      .then((data) => setProblemDescription(data))
      .catch((error) =>
        console.error("Error loading problem description:", error)
      );
  }, []);

  return { problemDescription };
};

export default useFetchProblem;
