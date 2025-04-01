import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import SuccessOverlay from "../IndexSections/SuccessOverlay";

import { registerUser } from "../../api/api";
import {
  Button,
  Card,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Container,
  Row,
  Col,
} from "reactstrap";

import DemoNavbar from "components/Navbars/DemoNavbar.js";
import SimpleFooter from "components/Footers/SimpleFooter.js";

const RegisterSchema = Yup.object().shape({
  fullname: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "")
    .required("Required"),
  streetName: Yup.string().required("Required"),
  houseNumber: Yup.number().required("Required"),
  zipCode: Yup.number().required("Required"),
  city: Yup.string().required("Required"),
  country: Yup.string().required("Required"),
  phoneNumber: Yup.number().required("Required"),
});

const FormInput = ({ name, placeholder, type, icon, formik }) => {
  const { values, handleChange, handleBlur, errors, touched } = formik;
  return (
    <FormGroup>
      <InputGroup className="input-group-alternative mb-3">
        <InputGroupAddon addonType="prepend">
          <InputGroupText>
            <i className={icon} />
          </InputGroupText>
        </InputGroupAddon>
        <Input
          name={name}
          placeholder={placeholder}
          type={type}
          value={values[name]}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {errors[name] && touched[name] ? (
          <div className="text-danger font-italic mt-2 ml--5">
            <small>{errors[name]}</small>
          </div>
        ) : null}
      </InputGroup>
    </FormGroup>
  );
};

const Register = () => {
  const [confirmPasswordMatch, setConfirmPasswordMatch] = useState(null);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleRegistrationSuccess = () => {
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    window.location.href = "/login-page";
    setShowOverlay(false);
  };

  const formik = useFormik({
    initialValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      streetName: "",
      houseNumber: "",
      zipCode: "",
      city: "",
      country: "",
      phoneNumber: "",
    },
    validationSchema: RegisterSchema,
    onSubmit: async (values) => {
      try {
        const response = await registerUser(values);
        if (response.success) {
          setConfirmPasswordMatch(null);
          setAllFieldsFilled(false);
          setRegistrationSuccess(true);
          handleRegistrationSuccess();
          formik.resetForm();
        }
      } catch (error) {
        console.error("Error during registration: ", error.message);
        setRegistrationError(error.message);
      } finally {
        setTimeout(() => {
          setRegistrationError(null);
        }, 5000);
      }
    },
  });

  useEffect(() => {
    const areAllFieldsFilled = Object.values(formik.values).every((value) =>
      typeof value === "string" ? value.trim() !== "" : String(value).trim() !== ""
    );
    setAllFieldsFilled(areAllFieldsFilled);
    setConfirmPasswordMatch(
      formik.values.password !== "" &&
        formik.values.confirmPassword !== "" &&
        formik.values.confirmPassword === formik.values.password
    );
  }, [formik.values]);

  return (
    <>
      <DemoNavbar />
      <main>
        <section className="section section-shaped section-lg">
          <div className="shape shape-style-1 bg-gradient-default">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <Container className="pt-lg-7">
            <Row className="justify-content-center">
              <Col lg="5">
                <Card className="bg-secondary shadow border-0">
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-center text-muted mb-4">
                      <small>Sign up with credentials</small>
                    </div>
                    <Form role="form" onSubmit={formik.handleSubmit}>
                      <FormInput name="fullname" placeholder="Full Name" type="text" icon="ni ni-hat-3" formik={formik} />
                      <FormInput name="email" placeholder="Email" type="email" icon="ni ni-email-83" formik={formik} />
                      <FormInput
                        name="password"
                        placeholder="Password"
                        type="password"
                        icon="ni ni-lock-circle-open"
                        formik={formik}
                      />
                      <FormGroup
                        className={confirmPasswordMatch === null ? "" : confirmPasswordMatch ? "has-success" : "has-danger"}
                      >
                        <InputGroup className="input-group-alternative mb-3">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-lock-circle-open" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            className={`form-control-alternative ${
                              confirmPasswordMatch === null ? "" : confirmPasswordMatch ? "is-valid" : "is-invalid"
                            }`}
                            placeholder="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.confirmPassword}
                          />
                          {formik.errors.confirmPassword && formik.touched.confirmPassword ? (
                            <div className="text-danger">{formik.errors.confirmPassword}</div>
                          ) : null}
                        </InputGroup>
                        <div className="text-muted font-italic">
                          <small>Enter Address: </small>
                        </div>
                      </FormGroup>
                      <FormInput
                        name="streetName"
                        placeholder="Street Name"
                        type="text"
                        icon="ni ni-square-pin"
                        formik={formik}
                      />
                      <FormInput
                        name="houseNumber"
                        placeholder="House Number"
                        type="number"
                        icon="ni ni-building"
                        formik={formik}
                      />
                      <FormInput name="zipCode" placeholder="ZIP Code" type="number" icon="ni ni-map-big" formik={formik} />
                      <FormInput name="city" placeholder="City" type="text" icon="ni ni-square-pin" formik={formik} />
                      <FormInput name="country" placeholder="Country" type="text" icon="ni ni-world" formik={formik} />
                      <FormInput
                        name="phoneNumber"
                        placeholder="Phone Number"
                        type="number"
                        icon="ni ni-mobile-button"
                        formik={formik}
                      />
                      <Row className="my-4">
                        <Col xs="12">
                          <div className="custom-control custom-control-alternative custom-checkbox">
                            <input className="custom-control-input" id="customCheckRegister" type="checkbox" />
                            <label className="custom-control-label" htmlFor="customCheckRegister">
                              <span>
                                I agree with the{" "}
                                <a href="#pablo" onClick={(e) => e.preventDefault()}>
                                  Privacy Policy
                                </a>
                              </span>
                            </label>
                          </div>
                        </Col>
                      </Row>

                      <div className="text-center">
                        <Button
                          color={confirmPasswordMatch && allFieldsFilled ? "primary" : "secondary"}
                          type="submit"
                          disabled={!confirmPasswordMatch || !allFieldsFilled}
                        >
                          Create account
                        </Button>
                      </div>
                      <SuccessOverlay
                        show={showOverlay}
                        message="Registration Successful"
                        buttonText="Login"
                        onClose={handleCloseOverlay}
                      />
                      {registrationError && (
                        <Row className="my-4">
                          <Col xs="12">
                            <div className="custom-control custom-control-alternative">
                              <label className="h6 text-danger text-bold ">
                                <span>{registrationError}</span>
                              </label>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </Form>
                  </CardBody>
                </Card>
                <Row className="mt-3">
                  <Col className="text-left" xs="6">
                    <a className="text-light" href="/login-page">
                      <small>Login here</small>
                    </a>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
      <SimpleFooter />
    </>
  );
};

export default Register;
