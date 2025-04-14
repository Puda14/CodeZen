"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ContestDetail from "@/components/contest/ContestDetail";
import { getUserIdFromToken } from "@/utils/auth/getUserIdFromToken";
import api from "@/utils/coreApi";

const ContestDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await api.get(`/contest/${id}`);
        const data = res.data;

        const currentUserId = getUserIdFromToken();

        setContest(data);
      } catch (err) {
        console.error("Failed to fetch contest:", err);
        router.push("/contests");
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!contest) return <p className="text-center mt-10">Contest not found</p>;

  return <ContestDetail contest={contest} />;
};

export default ContestDetailPage;
