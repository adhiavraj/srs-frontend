import React, { useState, useRef } from "react";
import Preview from "./Preview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { generateSRS } from "../api";

const MAX_MEMBERS = 3;

const example = {
  projectName: "Smart Attendance Management System",
  description:
    "A responsive web application to automate college attendance using enrollment numbers, with monthly PDF/XLSX reports and role-based access for students, faculty, and admin.",
  members: ["Vraj Adhia", "John Doe", "Jane Smith"],
};

export default function SRSForm() {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([""]);
  const [autoExpandedContent, setAutoExpandedContent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const previewRef = useRef();

  // add member (limit MAX_MEMBERS)
  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    setMembers((m) => [...m, ""]);
  };

  const removeMember = (idx) => {
    setMembers((m) => m.filter((_, i) => i !== idx));
  };

  const updateMember = (idx, value) => {
    setMembers((m) => m.map((item, i) => (i === idx ? value : item)));
  };

  // Simple "amplifier" - expand minimal inputs into SRS text.
  const generateSRSContent = () => {
    const name = projectName.trim() || "Untitled Project";
    const desc = description.trim() || "No description provided.";
    const group = members.filter(Boolean).length ? members.filter(Boolean) : ["(No members)"];

    // Build high-quality SRS sections derived from the short inputs.
    const content = {
      cover: {
        title: "Software Requirements Specification (SRS)",
        projectName: name,
        description: desc,
        members: group,
        date: new Date().toLocaleDateString(),
      },
      introduction: {
        purpose:
          `The purpose of this document is to provide a comprehensive Software Requirements Specification (SRS) for the "${name}" project. ` +
          `This SRS captures the objectives, scope, and formalized requirements to align stakeholders, designers, and developers.`,

        scope:
          `The ${name} aims to ${desc} ` +
          `This SRS defines functional and non-functional requirements, external interfaces, constraints, and user characteristics required to deliver the system.`,

        definitions: [
          { term: "SRS", meaning: "Software Requirements Specification" },
          { term: "DBMS", meaning: "Database Management System" },
          { term: "KYC", meaning: "Know Your Customer (if applicable for the project)" },
        ],

        references:
          "Relevant documents and references include project proposal, design mockups, any API contracts, and applicable coding or security standards.",
      },

      generalDescription: {
        productPerspective:
          `${name} is a standalone web-based system designed to integrate with existing college/staff systems as needed. It provides a front-end UI for students and faculty and a backend API for data storage and reporting.`,

        productFunctions:
          "Key functions include: user authentication and role management, class/session creation by faculty, student joining via enrollment number, attendance capture and modification, monthly report generation in PDF/XLSX formats, and administrative management features.",

        userCharacteristics:
          "Primary users are (1) Students — will join sessions using enrollment numbers, (2) Faculty — will create and manage attendance sessions and reports, and (3) Administrators — will manage users, audit logs, and system configuration.",

        generalConstraints:
          "The application must be responsive, work on modern mobile/desktop browsers, adhere to data privacy rules (as applicable), and operate with the chosen DBMS and hosting limits.",

        assumptionsDependencies:
          "Assumes stable network connectivity for users, availability of any external APIs (if used), and that user enrollment numbers are unique. Dependencies may include authentication services, email providers, and external data APIs."
      },

      specificRequirements: {
        functionalRequirements: [
          "FR-1: User login/logout with role-based access control (Student, Faculty, Admin).",
          "FR-2: Faculty can create attendance sessions with date/time and subject details.",
          "FR-3: Students can join sessions using unique enrollment numbers and mark attendance.",
          "FR-4: Admin can generate monthly attendance reports for any class in PDF/XLSX.",
          "FR-5: System must maintain attendance history and allow limited edits with audit logs."
        ],

        externalInterfaceRequirements:
          "RESTful JSON API endpoints for frontend-backend communication. If integrations exist, define payload formats, auth methods (e.g., JWT), rate limits, and error handling.",

        nonFunctionalRequirements: [
          "NFR-1: Performance — typical page load times < 2s on modern connections.",
          "NFR-2: Security — store passwords hashed, use HTTPS, follow OWASP best practices.",
          "NFR-3: Usability — responsive UI with clear workflows for students and faculty.",
          "NFR-4: Reliability — data must be backed up; system uptime target 99%."
        ],
      }
    };

    setAutoExpandedContent(content);
    setPreviewMode(true);
    // Scroll preview into view (optional)
    setTimeout(() => {
      if (previewRef.current) previewRef.current.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const handleAutoFill = () => {
    setProjectName(example.projectName);
    setDescription(example.description);
    setMembers(example.members.slice(0, MAX_MEMBERS));
  };

  function fixColors(element) {
    const elements = element.querySelectorAll("*");
    elements.forEach(el => {
      const styles = getComputedStyle(el);
      ["color", "backgroundColor", "borderColor"].forEach(prop => {
        const val = styles[prop];
        if (val.includes("oklch")) {
          el.style[prop] = "rgb(0,0,0)"; // fallback (or pick your own)
        }
      });
    });
  }

  // PDF generation from previewRef
  const exportToPDF = async () => {
    if (!autoExpandedContent) {
      alert("Generate the SRS first (click Generate SRS).");
      return;
    }
    const input = document.getElementById("srs-preview");
    if (!input) {
      alert("Preview not ready.");
      return;
    }

    // Apply color fix BEFORE rendering
    fixColors(input);

    const doc = new jsPDF("p", "mm", "a4");
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: input.scrollWidth,
      windowHeight: input.scrollHeight
    });

    const imgData = canvas.toDataURL("image/png");
    const imgProps = doc.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    if (imgHeight <= pdfHeight) {
      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      // pagination logic (can improve later if needed)
      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    doc.save(`${projectName || "project"}-SRS.pdf`);
  };

  const downloadFromBackend = async () => {

    if (!autoExpandedContent) {
      alert("Generate the SRS first (click Generate SRS).");
      return;
    }

    const backendHostApi = import.meta.env.VITE_API_URL;
  
    try {
      const response = await fetch(`${backendHostApi}/api/generate-srs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cover: `
            Title: ${autoExpandedContent.cover.title}
            Project: ${autoExpandedContent.cover.projectName}
            Description: ${autoExpandedContent.cover.description}
            Members: ${autoExpandedContent.cover.members.join(", ")}
            Date: ${autoExpandedContent.cover.date}
          `,
          introduction: `
            Purpose: ${autoExpandedContent.introduction.purpose}
            Scope: ${autoExpandedContent.introduction.scope}
            Definitions: ${autoExpandedContent.introduction.definitions.map(d => `${d.term} = ${d.meaning}`).join("; ")}
            References: ${autoExpandedContent.introduction.references}
          `,
          generalDescription: `
            Product Perspective: ${autoExpandedContent.generalDescription.productPerspective}
            Product Functions: ${autoExpandedContent.generalDescription.productFunctions}
            User Characteristics: ${autoExpandedContent.generalDescription.userCharacteristics}
            Constraints: ${autoExpandedContent.generalDescription.generalConstraints}
            Assumptions/Dependencies: ${autoExpandedContent.generalDescription.assumptionsDependencies}
          `,
          specificRequirements: `
            Functional Requirements: ${autoExpandedContent.specificRequirements.functionalRequirements.join(" | ")}
            External Interfaces: ${autoExpandedContent.specificRequirements.externalInterfaceRequirements}
            Non-Functional Requirements: ${autoExpandedContent.specificRequirements.nonFunctionalRequirements.join(" | ")}
          `
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate PDF from backend");
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName || "project"}-SRS.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error downloading PDF from backend");
    }
  };
  
  
  



  return (
    <div className="space-y-6 flex flex-col w-full">
      <section className="bg-formbody p-4 rounded-md shadow-sm text-primary ring-2 ring-slate-800">
        <h2 className="text-lg font-medium mb-3">Project Info</h2>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Project Name</span>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="mt-1 w-full ring-1 ring-slate-800 border-none outline-none rounded-md px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Short Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="1-2 line description"
              rows={3}
              className="mt-1 w-full ring-1 ring-slate-800 border-none outline-none rounded-md px-3 py-2 text-sm"
            />
          </label>

          <div className="">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Group Members (max {MAX_MEMBERS})</span>
              <button
                onClick={addMember}
                className="text-xs text-primary cursor-pointer"
                disabled={members.length >= MAX_MEMBERS}
                type="button"
              >
                + Add
              </button>
            </div>

            <div className="mt-2 space-y-2 sm:flex sm:flex-col">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={m}
                    onChange={(e) => updateMember(i, e.target.value)}
                    placeholder={`Member ${i + 1} name`}
                    className="flex-1 ring-1 ring-slate-800 border-none outline-none rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => removeMember(i)}
                    className="px-3 py-2 bg-rose-900 text-primary cursor-pointer font-semib rounded-sm text-sm"
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex max-sm:flex-col gap-2 mt-3">
            <button
              onClick={generateSRSContent}
              className="px-4 py-2 bg-blue-600 text-primary font-semibold cursor-pointer rounded-md hover:bg-blue-700"
            >
              Generate SRS
            </button>

            <button
              onClick={handleAutoFill}
              className="px-4 py-2 bg-gray-700 text-primary rounded-md font-semibold cursor-pointer"
            >
              Auto-fill Example
            </button>

            <button
              onClick={() => {
                setProjectName("");
                setDescription("");
                setMembers([""]);
                setAutoExpandedContent(null);
                setPreviewMode(false);
              }}
              className="px-4 py-2 bg-rose-900 text-primary rounded-md font-semibold cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Preview & PDF actions */}
      {previewMode && autoExpandedContent && (
        <section ref={previewRef} id="preview-section" className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2 text-heading">Preview</h3>
              <div id="srs-preview" className="ring-3 ring-slate-800 text-primary preview-page bg-background">
                <Preview content={autoExpandedContent} />
              </div>
            </div>

            <div className="w-full lg:w-64">
              <h3 className="text-lg font-medium mb-2 text-heading">Export</h3>
              <div className="bg-background ring-3 ring-slate-800 p-4 rounded-md shadow-sm space-y-3">
                <p className="text-sm text-primary">Project: <span className="font-medium">{projectName || "Untitled"}</span></p>
                <p className="text-sm text-primary">Members: <span className="font-medium">{members.filter(Boolean).join(", ") || "(No members)"}</span></p>

                <button
                  onClick={downloadFromBackend}
                  className="w-full px-3 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 cursor-pointer"
                >
                  Download PDF
                </button>
                {/* <button
                  onClick={() => window.print()}
                  className="w-full px-3 py-2 border bg-amber-50 rounded-md"
                >
                  Print (browser)
                </button> */}
                <p className="text-xs text-gray-500">
                  Tip: Use the Download PDF button for a saved copy. On some browsers long documents may paginate differently.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
