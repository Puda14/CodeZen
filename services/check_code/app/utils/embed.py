from transformers import RobertaTokenizer, RobertaModel
import torch # type: ignore

tokenizer = RobertaTokenizer.from_pretrained("microsoft/graphcodebert-base")
model = RobertaModel.from_pretrained("microsoft/graphcodebert-base")
model.eval()

def get_embedding(code: str):
  tokens = tokenizer(code, return_tensors="pt", truncation=True, padding=True, max_length=512)
  with torch.no_grad():
    outputs = model(**tokens)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
