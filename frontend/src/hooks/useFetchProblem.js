import { useState, useEffect } from "react";
import api from "@/utils/coreApi";

const useFetchProblem = (contestId, problemId) => {
  const [problemData, setProblemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contestId && problemId) {
      let isActive = true;
      const fetchProblem = async () => {
        setIsLoading(true);
        setError(null);
        setProblemData(null);
        try {
          const response = await api.get(
            `/contest/${contestId}/problems/${problemId}/contestant`
          );
          if (isActive) {
            if (
              typeof response.data !== "object" ||
              response.data === null ||
              !response.data._id
            ) {
              throw new Error("Invalid problem data received from API.");
            }
            setProblemData(response.data);
          }
        } catch (err) {
          console.error("Error loading problem data:", err);
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            "Failed to load problem.";
          if (isActive) {
            setError(errorMsg);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      fetchProblem();

      return () => {
        isActive = false;
      };
    } else {
      setError("Missing Contest ID or Problem ID.");
      setIsLoading(false);
      setProblemData(null);
    }
  }, [contestId, problemId]);

  return { problemData, isLoading, error };
};

export default useFetchProblem;
