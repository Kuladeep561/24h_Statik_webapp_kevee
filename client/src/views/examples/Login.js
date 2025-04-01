import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import useSignIn from "react-auth-kit/hooks/useSignIn";
import { loginUser } from "../../api/api";
// reactstrap components
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

// core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import SimpleFooter from "components/Footers/SimpleFooter.js";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});

const Login = (props) => {
  const [loginError, setLoginError] = React.useState("");
  const mainRef = React.useRef(null);
  const navigate = useNavigate();
  const redirectPath = localStorage.getItem("redirectPath");

  const signIn = useSignIn();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      try {
        const response = await loginUser(values);
        if (response.success) {
          if (
            signIn({
              auth: {
                token: response.data.token,
                type: "Bearer",
              },
              refresh: response.data.refreshToken,
              userState: {
                name: response.data.name,
                uid: response.data.uid,
              },
            })
          ) {
            localStorage.setItem("tokenExpiration", Date.now() + 86400000);
            localStorage.setItem("email", values.email);
            if (redirectPath) {
              navigate(redirectPath);
              localStorage.removeItem("redirectPath");
            } else {
              navigate("/");
            }
          } else {
            setLoginError("Sign in failed");
          }
        }
      } catch (error) {
        console.error("Error during login: ", error.message);
        setLoginError(error.message);
      }
    },
  });

  return (
    <>
      <DemoNavbar />
      <main ref={mainRef}>
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
                      <small>Sign in with credentials</small>
                    </div>
                    <Form role="form" onSubmit={formik.handleSubmit}>
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-email-83" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            placeholder="Email"
                            type="email"
                            id="email"
                            onChange={formik.handleChange}
                            value={formik.values.email}
                          />
                        </InputGroup>
                        {formik.errors.email && formik.touched.email ? (
                          <div>{formik.errors.email}</div>
                        ) : null}
                      </FormGroup>
                      <FormGroup>
                        <InputGroup className="input-group-alternative">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-lock-circle-open" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            placeholder="Password"
                            type="password"
                            id="password"
                            autoComplete="off"
                            onChange={formik.handleChange}
                            value={formik.values.password}
                          />
                        </InputGroup>
                        {formik.errors.password && formik.touched.password ? (
                          <div>{formik.errors.password}</div>
                        ) : null}
                      </FormGroup>
                      {loginError && (
                        <div style={{ color: "red" }}>{loginError}</div>
                      )}

                      <div className="custom-control custom-control-alternative custom-checkbox">
                        <input
                          className="custom-control-input"
                          id=" customCheckLogin"
                          type="checkbox"
                        />
                        <label
                          className="custom-control-label"
                          htmlFor=" customCheckLogin"
                        >
                          <span>Remember me</span>
                        </label>
                      </div>
                      <div className="text-center">
                        <Button className="my-4" color="primary" type="submit">
                          Sign in
                        </Button>
                      </div>
                    </Form>
                  </CardBody>
                </Card>
                <Row className="mt-3">
                  <Col xs="6">
                    <a
                      className="text-light"
                      href="#pablo"
                      onClick={(e) => e.preventDefault()}
                    >
                      <small>Forgot password?</small>
                    </a>
                  </Col>
                  <Col className="text-right" xs="6">
                    <a className="text-light" href="/register-page">
                      <small>Create new account</small>
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

export default Login;
