from collections import defaultdict

from app.utils.embed import get_embedding
from app.utils.similarity import (
  find_suspicious_pairs,
  group_copies_from_pairs
)
from app.utils.code_normalizer import normalize_code_with_gemini


class SemanticSimilarityPipeline:
  def __init__(
    self,
    embedding_fn=get_embedding,
    similarity_fn=find_suspicious_pairs,
    threshold=0.05
  ):
    self.get_embedding = embedding_fn
    self.find_suspicious_pairs = similarity_fn
    self.threshold = threshold

  def run(self, submissions_data):
    result = []

    if not submissions_data or not submissions_data[0].problems:
      return result

    for prob in submissions_data[0].problems:
      prob_id = prob.problem.id
      prob_name = prob.problem.name

      user_clusters = defaultdict(list)
      user_meta = {}
      submission_info = []

      for user_data in submissions_data:
        user_id = user_data.user.id
        username = user_data.user.username
        user_meta[user_id] = username

        matching_problem = next(
          (p for p in user_data.problems if p.problem.id == prob_id),
          None
        )

        if not matching_problem:
          continue

        for s in matching_problem.submissions:
          normalized_code = normalize_code_with_gemini(s.code)
          # print(f"{s.id}:")
          # print("→ Original:\n", s.code)
          # print("→ Normalized:\n", normalized_code)
          vec = self.get_embedding(normalized_code)

          submission_info.append({
            "user_id": user_id,
            "username": username,
            "submission_id": s.id,
            "raw_code": s.code,
            "normalized_code": normalized_code,
            "vector": vec
          })

      suspicious_pairs = self.find_suspicious_pairs(
        submission_info,
        self.threshold
      )
      copy_clusters = group_copies_from_pairs(suspicious_pairs)

      result.append({
        "problem_id": prob_id,
        "problem_name": prob_name,
        "checkResult": copy_clusters
      })

    return result
