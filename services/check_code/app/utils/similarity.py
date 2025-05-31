import numpy as np  # type: ignore
import faiss  # type: ignore
from collections import defaultdict
from typing import List, Dict

THRESHOLD = 0.97

def find_suspicious_pairs(
  submission_info: List[Dict],
  threshold: float = THRESHOLD
) -> List[Dict]:
  vectors = [entry["vector"] for entry in submission_info]
  vectors = np.array(vectors).astype("float32")

  if len(vectors) == 0 or vectors.ndim != 2:
    return []
  faiss.normalize_L2(vectors)

  user_clusters = defaultdict(list)
  for i, info in enumerate(submission_info):
    user_clusters[info["user_id"]].append((i, info))

  suspicious = []
  for ua in user_clusters:
    for ub in user_clusters:
      if ua == ub:
        continue

      idx_a = [i for i, _ in user_clusters[ua]]
      idx_b = [i for i, _ in user_clusters[ub]]
      if not idx_a or not idx_b:
        continue

      vec_a = vectors[idx_a]
      vec_b = vectors[idx_b]

      index = faiss.IndexFlatIP(vec_b.shape[1])
      index.add(vec_b)
      D, I = index.search(vec_a, k=1)

      for i_local, (score, j_local) in enumerate(zip(D[:, 0], I[:, 0])):
        # print(f"Similarity between {submission_info[idx_a[i_local]]['submission_id']} and {submission_info[idx_b[j_local]]['submission_id']} = {score}")
        if score > threshold:
          i_global = idx_a[i_local]
          j_global = idx_b[j_local]
          suspicious.append({
            "user_a": submission_info[i_global]["user_id"],
            "username_a": submission_info[i_global]["username"],
            "submission_a": submission_info[i_global]["submission_id"],
            "raw_code_a": submission_info[i_global]["raw_code"],
            "user_b": submission_info[j_global]["user_id"],
            "username_b": submission_info[j_global]["username"],
            "submission_b": submission_info[j_global]["submission_id"],
            "raw_code_b": submission_info[j_global]["raw_code"],
            "similarity": float(score)
          })

  return suspicious


def group_copies_from_pairs(pairs: List[Dict], threshold: float = THRESHOLD) -> List[List[Dict]]:
  parent = {}

  def find(x):
    parent.setdefault(x, x)
    if parent[x] != x:
      parent[x] = find(parent[x])
    return parent[x]

  def union(x, y):
    parent.setdefault(x, x)
    parent.setdefault(y, y)
    parent[find(x)] = find(y)

  for pair in pairs:
    if pair.get("similarity", 1.0) > threshold:
      a = pair["submission_a"]
      b = pair["submission_b"]
      union(a, b)

  groups = defaultdict(set)
  id_to_info = {}

  for pair in pairs:
    for prefix in ["a", "b"]:
      sid = pair[f"submission_{prefix}"]
      user = pair[f"user_{prefix}"]
      username = pair[f"username_{prefix}"]
      raw_code = pair[f"raw_code_{prefix}"]

      id_to_info[sid] = {
        "submission_id": sid,
        "user_id": user,
        "username": username,
        "code": raw_code
      }
      root = find(sid)
      groups[root].add(sid)

  result = []
  for group_ids in groups.values():
    if len(group_ids) < 2:
      continue
    cluster = [id_to_info[sid] for sid in group_ids]
    result.append(cluster)

  return result
