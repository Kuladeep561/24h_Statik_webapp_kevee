import React, { useRef, useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import SuccessOverlay from "../IndexSections/SuccessOverlay";

// reactstrap components
import { Form, Row, Col, Card, Container, Button, UncontrolledAlert } from "reactstrap";
import { uploadAndEmail } from "../../api/api";
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import SimpleFooter from "components/Footers/SimpleFooter.js";

const uploadSchema = Yup.object().shape({
  uploadFile: Yup.array().min(1, "Please upload the design calculation file"),
});

const renderFileInput = (label, fieldName, formik) => {
  return (
    <Row>
      <Col lg="7" sm="7">
        <h5 className="text-default font-weight-bold mb-1">{label}</h5>
      </Col>
      <Col lg="3" sm="3">
        <input
          type="file"
          name={fieldName}
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files);
            formik.setFieldValue(fieldName, files);
          }}
        />
      </Col>
    </Row>
  );
};

const Upload = ({ requestId }) => {
  const _requestId = requestId.replace(":", "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleUploadSuccess = () => {
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    window.location.href = "/";
    setShowOverlay(false);
  };

  const mainRef = useRef(null);
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainRef.current.scrollTop = 0;
  }, []);

  const formik = useFormik({
    initialValues: {
      uploadFile: [],
    },
    validationSchema: uploadSchema,
    onSubmit: async (values) => {
      document.body.style.cursor = "wait";
      const formData = new FormData();
      const email = localStorage.getItem("email");

      for (const [key, value] of Object.entries(values)) {
        if (!key.endsWith("File")) {
          formData.append(key, value);
        }
      }
      // Append all files to formdata
      Object.keys(values).forEach((key) => {
        if (key.endsWith("File")) {
          values[key].forEach((file) => {
            formData.append(key, file);
          });
        }
      });

      formData.append("requestId", _requestId);
      formData.append("submittedBy", email);

      try {
        const resp = await uploadAndEmail(formData);
        if (resp.status === 200) {
          setShowSuccess(true);
          handleUploadSuccess();
          setTimeout(() => setShowSuccess(false), 3000);
          formik.resetForm();
          // This should reset the form to its initial values
        }
      } catch (error) {
        console.error("Error:", error);
        setShowFailure(true);
        setTimeout(() => setShowFailure(false), 3000);
      } finally {
        document.body.style.cursor = "default";
      }
    },
  });

  return (
    <>
      <DemoNavbar />
      <main className="profile-page" ref={mainRef}>
        <section className="section-profile-cover section-shaped my--6">
          {/* Circles background */}
          <div className="shape shape-style-ar shape-primary alpha-4">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          {/* SVG separator */}
          <div className="separator separator-bottom separator-skew">
            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
              <polygon className="fill-white" points="2560 0 2560 100 0 100" />
            </svg>
          </div>
        </section>
        <section className="section">
          <Container>
            <Card className="card-profile shadow mt--300">
              <div className="px-4">
                <div className="text-center mt-8">
                  <h1 className="text-warning font-weight-bold mt--6 mb-4">Upload</h1>
                  <div>
                    <i className="ni education_hat mr-2" />
                    Upload your final results (docx/pdf) into the sharepoint folder.
                  </div>
                </div>
                <Container className="mb-6">
                  <div className="mb-4 mt-1">
                    <ul className="text-muted" style={{ listStyleType: "none", padding: 0 }}>
                      <small>Ensure the project ID is verified twice before uploading the file*</small>
                    </ul>
                  </div>

                  <Form
                    role="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      formik.handleSubmit(e);
                    }}
                  >
                    {renderFileInput(
                      <>
                        Submit your design for the project <span className="text-danger">{_requestId}</span> here:
                      </>,
                      "uploadFile",
                      formik
                    )}
                    {/* {renderFileInput(`Upload the final results for the project ${_requestId}`, "uploadFile", formik)} */}
                    <Row>
                      <Col lg="5" sm="5">
                        <Button color="primary mt-4 mb-3" type="submit">
                          Submit & Email
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                  <SuccessOverlay
                    show={showOverlay}
                    message="Submission Successful"
                    buttonText="Return to Homepage"
                    onClose={handleCloseOverlay}
                  />
                  {showSuccess && (
                    <UncontrolledAlert color="success" fade={true}>
                      <span className="alert-inner--icon">
                        <i className="ni ni-like-2" />
                      </span>{" "}
                      <span className="alert-inner--text">
                        <strong>Success!</strong> Your file has been submitted.
                      </span>
                    </UncontrolledAlert>
                  )}
                  {showFailure && (
                    <UncontrolledAlert color="danger" fade={true}>
                      <span className="alert-inner--icon">
                        <i className="ni ni-support-16" />
                      </span>{" "}
                      <span className="alert-inner--text">
                        <strong>Failure!</strong> Your submission has failed, try again or contact customer support.
                      </span>
                    </UncontrolledAlert>
                  )}
                </Container>
              </div>
            </Card>
          </Container>
        </section>
      </main>
    </>
  );
};

export default Upload;
