import React, { useRef, useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import SuccessOverlay from "../IndexSections/SuccessOverlay";

// reactstrap components
import {
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Card,
  Container,
  Button,
  UncontrolledAlert,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Pagination,
  PaginationItem,
  PaginationLink,
  UncontrolledTooltip,
} from "reactstrap";

import { submitWo, sendRequest } from "../../api/api";
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import SimpleFooter from "components/Footers/SimpleFooter.js";

const images = require.context("../../assets/img/info/wo", true);
let imgFiles = {};

images.keys().forEach((item) => {
  imgFiles[item.replace("./", "")] = images(item);
});

const wallOpeningSchema = Yup.object().shape({
  str: Yup.string().required("Required"),
  PLZ: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  ort: Yup.string().required("Required"),
  durchbruches: Yup.string().required("Required"),
  gebaeudeart: Yup.string().required("Required"),
  baujahr: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  dachkonstruktion: Yup.string().required("Required"),
  obergeschosse: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  untergeschosse: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  betroffeneWand: Yup.string().required("Required"),
  tragendeWand: Yup.string().required("Required"),
  wandputzType: Yup.string(),
  wandputzTiefe: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .default(0),
  betroffenesGeschoss: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  wandbaustoff: Yup.string().required("Required"),
  breite: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  hoehe: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  tiefe: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  d1: Yup.number().transform((value) => parseFloat(value.toString().replace(",", "."))),
  d2: Yup.number().transform((value) => parseFloat(value.toString().replace(",", "."))),
  d3: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  d4: Yup.number().transform((value) => parseFloat(value.toString().replace(",", "."))),
  t1: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  l1: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  l2: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .default(0),
  t2: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .default(0),
  deckenkonstruktion: Yup.string().required("Required"),
  deckentiefe: Yup.number()
    .transform((value) => parseFloat(value.toString().replace(",", ".")))
    .required("Required"),
  statischeBerechnungFile: Yup.array(),
  darueberliegendesGeschossFile: Yup.array().min(1, "Required"),
  betroffenesGeschossFile: Yup.array().min(1, "Required"),
  darunterliegendesGeschossFile: Yup.array().min(1, "Required"),
  schnittGebaeudeFile: Yup.array().min(1, "Required"),
  durchbruchMaßenFile: Yup.array(),
  offnungMarkierenFile: Yup.array(),
  geschichte: Yup.string(),
});

const renderInputField = (name, placeholder, type, formik, disabled = false) => {
  const { values, handleChange, handleBlur, errors, touched } = formik;
  return (
    <FormGroup>
      <Input
        className="form-control-alternative"
        name={name}
        placeholder={placeholder}
        type={type}
        value={values[name] || ""}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {errors[name] && touched[name] ? (
        <div className="text-danger font-italic">
          <small>{errors[name]}</small>
        </div>
      ) : null}
    </FormGroup>
  );
};

// Render a single dropdown item
const renderDropdownItem = (item, dropdownName, setFieldValue) => (
  <DropdownItem
    key={item}
    href="#pablo"
    onClick={(e) => {
      e.preventDefault();
      setFieldValue(dropdownName, item);
    }}
  >
    {item}
  </DropdownItem>
);

// Render the custom input field for specified options

const renderCustomInput = (dropdownName, customInput, setCustomInput, setFieldValue) => (
  <Col lg="8" sm="8">
    <FormGroup>
      <Input
        className="form-control-alternative ml-7"
        placeholder="Sonstiges"
        type="text"
        name={dropdownName}
        value={customInput[dropdownName] || ""}
        onChange={(e) => {
          setCustomInput({ [dropdownName]: e.target.value });
        }}
        onBlur={(e) => {
          setFieldValue(dropdownName, e.target.value);
        }}
      />
    </FormGroup>
  </Col>
);

// Render the dropdown component
const renderDropdown = (dropdownName, formik, dropdowns, customInput, setCustomInput) => {
  const { values, setFieldValue } = formik;
  const selectedValue = values[dropdownName];

  if (!Array.isArray(dropdowns[dropdownName])) {
    console.error(`Dropdown items for '${dropdownName}' not found.`);
    return null;
  }

  return (
    <Row>
      <Col lg="2" sm="3">
        <FormGroup>
          <UncontrolledDropdown group>
            <DropdownToggle caret color="secondary">
              {selectedValue === "Sonstiges" ? "Sonstiges" : selectedValue || `Select ${dropdownName}`}
            </DropdownToggle>
            <DropdownMenu style={{ maxHeight: "200px", overflowY: "auto" }}>
              {dropdowns[dropdownName].map((item) => renderDropdownItem(item, dropdownName, setFieldValue))}
            </DropdownMenu>
          </UncontrolledDropdown>
        </FormGroup>
      </Col>
      {selectedValue === "Sonstiges" && renderCustomInput(dropdownName, customInput, setCustomInput, setFieldValue)}
    </Row>
  );
};

const renderFileInput = (label, fieldName, formik) => {
  return (
    <Row>
      <Col lg="3" sm="3">
        <h6>{label}</h6>
      </Col>
      <div>
        <input
          type="file"
          name={fieldName}
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files);
            formik.setFieldValue(fieldName, files);
          }}
        />
      </div>
    </Row>
  );
};

const Wo = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormError, setShowFormError] = useState(false);
  const [customInput, setCustomInput] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);

  const handleSubmissionSuccess = () => {
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    window.location.href = "/";
    setShowOverlay(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const mainRef = useRef(null);
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainRef.current.scrollTop = 0;
  }, []);

  const dropdowns = {
    durchbruches: ["Tür", "Fenster", "Öffnung", "Durchgang"],
    gebaeudeart: ["Einfamilienhaus", "Mehrfamilienhaus"],
    dachkonstruktion: ["Holzdachkonstruktion (Sattel-, Mansard-, Walm-, Pultdach)", "Stahlbeton-Flachdach", "Holz-Flachdach"],
    betroffeneWand: ["Innenwand", "Außenwand"],
    tragendeWand: ["Ja", "Nein", "Unsicher"],
    wandputz: ["beidseitig", "einseitig", "unverputzt"],
    wandbaustoff: ["Stahlbeton", "Mauerwerk"],
    deckenkonstruktion: ["Stahlbetondecke", "Holzbalkendecke", "Stahlsteindecke", "Spannbetonhohldielen"],
  };

  const formik = useFormik({
    initialValues: {
      str: "",
      PLZ: "",
      ort: "",
      durchbruches: "",
      gebaeudeart: "",
      baujahr: "",
      dachkonstruktion: "",
      obergeschosse: "",
      untergeschosse: "",
      betroffeneWand: "",
      tragendeWand: "",
      wandputzType: "",
      wandputzTiefe: 0,
      betroffenesGeschoss: "",
      wandbaustoff: "",
      breite: 0,
      hoehe: 0,
      tiefe: 0,
      d1: 0,
      d2: 0,
      d3: 0,
      d4: 0,
      t1: 0,
      l1: 0,
      l2: 0,
      t2: 0,
      deckenkonstruktion: "",
      deckentiefe: 0,
      statischeBerechnungFile: [],
      offnungMarkierenFile: [],
      durchbruchMaßenFile: [],
      darueberliegendesGeschossFile: [],
      betroffenesGeschossFile: [],
      darunterliegendesGeschossFile: [],
      schnittGebaeudeFile: [],
      geschichte: "",
    },
    validationSchema: wallOpeningSchema,
    onSubmit: async (values) => {
      document.body.style.cursor = "wait";
      const formData = new FormData();
      const email = localStorage.getItem("email");
      const module = "WO";

      // Append text/number fields to FormData
      for (const [key, value] of Object.entries(values)) {
        if (!key.endsWith("File")) {
          let cleanedValue = value;
          if (key !== "geschichte" && typeof value === "string" && value.includes(",")) {
            cleanedValue = value.replace(/,/g, ".");
          }
          formData.append(key, cleanedValue);
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

      try {
        // Step 1: Call sendRequest with module and email
        const response1 = await sendRequest(module, email);
        const data = response1.data;

        if (response1.status === 200 && data.success) {
          // Step 2: Capture requestId from the response
          const requestId = data.requestId;

          // Step 3: Append requestId to formData
          formData.append("requestId", requestId);
          // Step 4: Call submitWo with the updated formData
          const response2 = await submitWo(formData);

          if (response2.status === 200) {
            setShowSuccess(true);
            handleSubmissionSuccess();
            setTimeout(() => setShowSuccess(false), 3000);
            setCurrentPage(1);
            // handleReset();
          }
        } else {
          // Handle failure from sendRequest
          console.error("Failed to get requestId:", data);
          setShowFailure(true);
          setTimeout(() => setShowFailure(false), 3000);
        }

        if (Object.keys(formik.errors).length > 0) {
          setShowFormError(true);
        }
      } catch (error) {
        console.error("Error:", error);
        setShowFailure(true);
        setTimeout(() => setShowFailure(false), 3000);
      } finally {
        document.body.style.cursor = "default";
        // If there's any cleanup or final actions, ensure they don't interfere with your state updates
      }
    },
  });

  const handleReset = () => {
    formik.resetForm();
    setSelectedOption("");
  };
  const hasErrors = Object.keys(formik.errors).length > 0 && Object.keys(formik.touched).length > 0;

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
                <Row className="justify-content-center">
                  <Col className="order-lg-2" lg="3">
                    <div className="card-profile-image">
                      <a>
                        <img alt="..." className="rounded-circle" src={require("assets/img/theme/wm-800x800.jpg")} />
                      </a>
                    </div>
                  </Col>
                  <Col className="order-lg-3 text-lg-right align-self-lg-center" lg="4"></Col>
                  <Col className="order-lg-1" lg="4">
                    <div className="card-profile-stats d-flex justify-content-center"></div>
                  </Col>
                </Row>
                <div className="text-center mt-8">
                  <h3>Calculate Your Wall Openings </h3>

                  <div>
                    <i className="ni education_hat mr-2" />
                    We use most sofisticated technology to design your structural elemet.
                    <div>
                      <i className="ni education_hat mr-2" />
                      Please enter the necessary information in the below fields to design your element
                    </div>
                  </div>
                </div>
                <Container className="mb-6">
                  <div className="mb-3 mt-1">
                    <ul className="text-muted" style={{ listStyleType: "none", padding: 0 }}>
                      <li>
                        <small>Fields with * are required.</small>
                      </li>
                      <li>
                        <small>
                          Hover your cursor on to <i className="fa fa-info-circle"></i> for more information.
                        </small>
                      </li>
                    </ul>
                  </div>

                  <Form
                    role="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      formik.handleSubmit(e);
                    }}
                  >
                    {currentPage === 1 && (
                      <>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Gebäudestandort*</h6>
                          </Col>
                          {renderInputField("str", "str", "text", formik)}
                          {renderInputField("PLZ", "PLZ", "number", formik)}
                          {renderInputField("ort", "ort", "text", formik)}
                        </Row>

                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Art des Durchbruches*</h6>
                          </Col>
                          {renderDropdown("durchbruches", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Gebäudeart*</h6>
                          </Col>
                          {renderDropdown("gebaeudeart", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Baujahr*</h6>
                          </Col>
                          {renderInputField("baujahr", "baujahr", "number", formik)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Dachkonstruktion</h6>
                          </Col>
                          {renderDropdown("dachkonstruktion", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h5 className="text-warning font-weight-bold mb-1">Geschossigkeit</h5>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Anzahl Obergeschosse inkl. Dachgeschoss*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("obergeschosse", "obergeschosse", "number", formik)}

                            <i
                              id="obergeschosseTooltip"
                              className="fa fa-info-circle"
                              aria-hidden="true"
                              style={{ marginLeft: "9px" }}
                            />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="obergeschosseTooltip">
                            <img src={imgFiles["obergeschosse.png"]} alt="Tooltip" style={{ width: "250px", height: "320px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Anzahl Untergeschosse*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("untergeschosse", "untergeschosse", "number", formik)}

                            <i
                              id="untergeschosseTooltip"
                              className="fa fa-info-circle"
                              aria-hidden="true"
                              style={{ marginLeft: "9px" }}
                            />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="untergeschosseTooltip">
                            <img src={imgFiles["untergeschosse.png"]} alt="Tooltip" style={{ width: "250px", height: "320px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Betroffene Wand*</h6>
                          </Col>
                          {renderDropdown("betroffeneWand", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Tragende Wand*</h6>
                          </Col>
                          {renderDropdown("tragendeWand", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Betroffenes Geschoss*</h6>
                          </Col>
                          {renderInputField("betroffenesGeschoss", "Betroffenes Geschoss", "number", formik)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Wandputz</h6>
                          </Col>
                          <Row>
                            <Col lg="3" sm="3">
                              <FormGroup>
                                <UncontrolledDropdown group>
                                  <DropdownToggle caret color="secondary">
                                    {selectedOption || "Select Wandputz"}
                                  </DropdownToggle>
                                  <DropdownMenu
                                    style={{
                                      maxHeight: "200px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    {dropdowns["wandputz"].map((item, index) => (
                                      <DropdownItem
                                        key={index}
                                        href="#pablo"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedOption(item);
                                          formik.setFieldValue("wandputzType", item);

                                          // Reset the custom input field when the selected option changes
                                          if (item === "beidseitig" || "einseitig") {
                                            setCustomInput("");
                                            formik.setFieldValue("wandputzTiefe", "");
                                          }
                                        }}
                                      >
                                        {item}
                                      </DropdownItem>
                                    ))}
                                  </DropdownMenu>
                                </UncontrolledDropdown>
                              </FormGroup>
                            </Col>
                            {(selectedOption === "beidseitig" || selectedOption === "einseitig") && (
                              <Col lg="8" sm="8">
                                <FormGroup>
                                  <Input
                                    className="form-control-alternative ml-7"
                                    placeholder="Dicke bekannt in mm?"
                                    type="number"
                                    name="Dicke bekannt in mm?"
                                    value={customInput}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setCustomInput(value);
                                      formik.setFieldValue("wandputzTiefe", value);
                                    }}
                                  />
                                </FormGroup>
                              </Col>
                            )}
                          </Row>
                        </Row>

                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Wandbaustoff*</h6>
                          </Col>
                          {renderDropdown("wandbaustoff", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        {renderFileInput("Statische Berechnung des Gebäudes", "statischeBerechnungFile", formik)}
                      </>
                    )}
                    {currentPage === 2 && (
                      <>
                        <Row>
                          <Col lg="5" sm="5">
                            <h5 className="text-warning font-weight-bold mb-1">Grundrisse als Foto/Scan</h5>
                          </Col>
                        </Row>
                        {renderFileInput("Darüberliegendes Geschoss*", "darueberliegendesGeschossFile", formik)}
                        {renderFileInput("Betroffenes Geschoss*", "betroffenesGeschossFile", formik)}
                        {renderFileInput("darunterliegendes Geschoss*", "darunterliegendesGeschossFile", formik)}
                        {renderFileInput("Schnitt durch das Gebäude/Geschoss*", "schnittGebaeudeFile", formik)}
                        <Row>
                          <Col lg="5" sm="5">
                            <h5 className="text-warning font-weight-bold mb-1">Abmessung und der Öffnung</h5>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Breite (b)*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("breite", "in cm", "number", formik)}
                            <i
                              id="breiteTooltip"
                              className="fa fa-info-circle"
                              aria-hidden="true"
                              style={{
                                marginLeft: "9px",
                              }}
                            />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="breiteTooltip">
                            <img src={imgFiles["b.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Höhe (h)*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("hoehe", "in cm", "number", formik)}
                            <i id="hoheTooltip" className="fa fa-info-circle" aria-hidden="true" style={{ marginLeft: "9px" }} />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="hoheTooltip">
                            <img src={imgFiles["h.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Tiefe (t)*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("tiefe", "in cm", "number", formik)}
                            <i id="tiefeltip" className="fa fa-info-circle" aria-hidden="true" style={{ marginLeft: "9px" }} />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="tiefeltip">
                            <img src={imgFiles["t.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6></h6>
                          </Col>
                          <Col lg="3" sm="3">
                            <h6> (oder)</h6>
                          </Col>
                        </Row>
                        {renderFileInput("Foto/Skizze mit Angabe Durchbruch und Maßen", "durchbruchMaßenFile", formik)}
                        <Row>
                          <Col lg="5" sm="5">
                            <h5 className="text-warning font-weight-bold mb-1">Position der Öffnung</h5>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>d1*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("d1", "in cm", "number", formik)}

                            <i id="d1Tooltip" className="fa fa-info-circle" aria-hidden="true" style={{ marginLeft: "9px" }} />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="d1Tooltip">
                            <img src={imgFiles["d1.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>d2*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("d2", "in cm", "number", formik)}

                            <i id="d2Tooltip" className="fa fa-info-circle" aria-hidden="true" style={{ marginLeft: "9px" }} />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="d2Tooltip">
                            <img src={imgFiles["d2.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>d3*</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("d3", "in cm", "number", formik)}

                            <i id="d3Tooltip" className="fa fa-info-circle" aria-hidden="true" style={{ marginLeft: "9px" }} />
                          </div>
                          <UncontrolledTooltip delay={0} placement="right" target="d3Tooltip">
                            <img src={imgFiles["d3.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                          </UncontrolledTooltip>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>d4</h6>
                          </Col>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {renderInputField("d4", "in cm", "number", formik)}

                            <i id="d4Tooltip" className="fa fa-info-circle" aria-hidden="true" style={{ marginLeft: "9px" }} />

                            <UncontrolledTooltip delay={0} placement="right" target="d4Tooltip">
                              Wenn ja, messen Sie den Abstand vom Boden der Öffnung.
                            </UncontrolledTooltip>
                          </div>
                        </Row>
                        {renderFileInput("Foto mit Markierung", "offnungMarkierenFile", formik)}
                        <Row>
                          <Col lg="5" sm="5">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <h5 className="text-warning font-weight-bold mb-1">Abmessungen der Raeume</h5>
                              <i
                                id="raumsTooltip"
                                className="fa fa-info-circle"
                                aria-hidden="true"
                                style={{ marginLeft: "9px" }}
                              />
                              <UncontrolledTooltip delay={0} placement="right" target="raumsTooltip">
                                <img src={imgFiles["raums.png"]} alt="Tooltip" style={{ width: "250px", height: "220px" }} />
                              </UncontrolledTooltip>
                            </div>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg="5" sm="5">
                            <h6 className="text-muted font-weight-bold mb-1">Raum 1</h6>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Senkrecht zur Betroffenen Wand (t1)*</h6>
                          </Col>
                          {renderInputField("t1", "in cm", "number", formik)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Wandlänge od. Parallel zur Betroffenen Wand (l1)*</h6>
                          </Col>
                          {renderInputField("l1", "in cm", "number", formik)}
                        </Row>
                        <Row>
                          <Col lg="5" sm="5">
                            <h6 className="text-muted font-weight-bold mb-1">Raum 2</h6>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Senkrecht zur Betroffenen Wand (t2)*</h6>
                          </Col>
                          {renderInputField("t2", "in cm", "number", formik, formik.values.betroffeneWand === "Außenwand")}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Wandlänge od. Parallel zur Betroffenen Wand (l2)*</h6>
                          </Col>
                          {renderInputField("l2", "in cm", "number", formik, formik.values.betroffeneWand === "Außenwand")}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Deckenkonstruktion über dem Betroffenen Geschoss*</h6>
                          </Col>
                          {renderDropdown("deckenkonstruktion", formik, dropdowns, customInput, setCustomInput)}
                        </Row>
                        <Row>
                          <Col lg="3" sm="3">
                            <h6>Deckentiefe ber dem üBetroffenen Geschoss*</h6>
                          </Col>
                          {renderInputField("deckentiefe", "in cm", "number", formik)}
                        </Row>
                        <Row>
                          <Col lg="5" sm="5">
                            <h5 className="text-warning font-weight-bold mb-1">Erzählen Sie uns mehr</h5>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <Input
                              className="form-control-alternative"
                              placeholder="Schreiben Sie Ihre Geschichte hier ..."
                              rows="3"
                              type="textarea"
                              value={formik.values.geschichte} // Use Formik's values to set the input value
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const wordLimit = 250; // Set your desired word limit here
                                const words = newValue.trim().split(/\s+/);
                                if (words.length <= wordLimit) {
                                  formik.setFieldValue("geschichte", newValue); // Use Formik's setFieldValue to update the value
                                } else {
                                  alert(`Sie können nur bis zu ${wordLimit} Wörter eingeben`);
                                }
                              }}
                            />
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="5" sm="5">
                            <Button color="primary mt-3 mb-3" type="submit">
                              Submit
                            </Button>
                            {hasErrors && <div className="text-danger">Bitte füllen Sie alle Pflichtfelder aus.</div>}
                          </Col>
                        </Row>
                      </>
                    )}
                    <Pagination>
                      <PaginationItem className={currentPage === 1 ? "active" : ""}>
                        <PaginationLink onClick={() => handlePageChange(1)} href="#page1">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem className={currentPage === 2 ? "active" : ""}>
                        <PaginationLink onClick={() => handlePageChange(2)} href="#page2">
                          2
                        </PaginationLink>
                      </PaginationItem>
                    </Pagination>
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
                        <strong>Success!</strong> Your details have been submitted.
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
      <SimpleFooter />
    </>
  );
};

export default Wo;
