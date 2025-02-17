"use client";

import { useToast } from "../../context/ToastProvider";

export default function Template() {
  const headers = ["ID", "Name", "Status"];
  const data = [
    [1, "Alice", "Active"],
    [2, "Bob", "Inactive"],
    [3, "Charlie", "Pending"],
  ];

  const { showToast } = useToast();

  return (
    <div className="mt-0">
      <h1 className="text-4xl font-bold mb-6 text-center">Template</h1>
      <h1>Tiêu đề trang 1</h1>
      <h2>Tiêu đề trang 2</h2>
      <h3>Tiêu đề trang 3 </h3>
      <h4>Tiêu đề trang 4</h4>
      <h5>Tiêu đề trang 5</h5>

      <button className="btn btn-primary">Primary</button>
      <button className="btn btn-secondary">Secondary</button>
      <button className="btn btn-danger">Danger</button>
      <button className="btn btn-success">Success</button>
      <button className="btn btn-warning">Warning</button>
      <button className="btn btn-disabled">Disabled</button>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form>
        <h2>Contact Form</h2>

        {/* Name Input */}
        <div>
          <label>Name</label>
          <input type="text" placeholder="Enter your name" />
        </div>

        {/* Email Input */}
        <div>
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />
        </div>

        {/* Message Textarea */}
        <div>
          <label>Message</label>
          <textarea rows="4" placeholder="Enter your message"></textarea>
        </div>

        {/* Submit Button */}
        <button className="btn btn-primary">Send Message</button>
      </form>

      <div class="alert alert-success">
        <strong>Success!</strong> Your operation was completed successfully.
      </div>

      <div class="alert alert-error">
        <strong>Error!</strong> Something went wrong. Please try again.
      </div>

      <div class="alert alert-warning">
        <strong>Warning!</strong> Please check your input before proceeding.
      </div>

      <div className="space-x-4">
        <button
          className="btn btn-success"
          onClick={() => showToast("Your action was successful.", "success")}
        >
          Show Success Toast
        </button>

        <button
          className="btn btn-danger"
          onClick={() => showToast("Error! Something went wrong.", "error")}
        >
          Show Error Toast
        </button>

        <button
          className="btn btn-warning"
          onClick={() => showToast("Warning! Check your input.", "warning")}
        >
          Show Warning Toast
        </button>

        <button
          className="btn btn-primary"
          onClick={() => showToast("info! This is an update.", "info")}
        >
          Show Info Toast
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => showToast("You're amazing!", "praise")}
        >
          Show Praise Toast
        </button>
      </div>
    </div>
  );
}
