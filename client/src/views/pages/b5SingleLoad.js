import React from "react";

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
} from "reactstrap";
import { submitB5SingleLoad } from "../../api/api";

// core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import SimpleFooter from "components/Footers/SimpleFooter.js";

class b5SingleLoad extends React.Component {
  componentDidMount() {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    this.refs.main.scrollTop = 0;
  }
  state = {
    iCC: "",
    iCCKey: "",
    iHeight: "",
    iHy: "",
    iHz: "",
    iFx: "",
    formSubmitted: false,
  };

  ConcreteClassForStutzen = {
    "C 12/15": 20934,
    "C 16/20": 20935,
    "C 20/25": 20936,
    "C 25/30": 20937,
    "C 30/37": 20938,
    "C 35/45": 20939,
    "C 40/50": 20940,
    "C 45/55": 20941,
    "C 50/60": 20942,
    "C 55/67": 20943,
    "C 60/75": 20944,
    "C 70/85": 20945,
    "C 80/95": 20946,
    "C 90/105": 20947,
    "C 100/115": 20948,
    "LC 12/13": 20949,
    "LC 16/18": 20950,
    "LC 20/22": 20951,
    "LC 25/28": 20952,
    "LC 30/33": 20953,
    "LC 35/38": 20954,
    "LC 40/44": 20955,
    "LC 45/50": 20956,
    "LC 50/55": 20957,
    "LC 55/60": 20958,
    "LC 60/66": 20959,
    "LC 70/77": 20960,
    "LC 80/88": 20961,
  };

  handleSubmit = (event) => {
    event.preventDefault();

    if (!this.state.iCCKey) {
      this.setState({ dropdownError: true });
      return;
    }
    // Send the form values to the backend
    submitB5SingleLoad(this.state)
      .then((data) => {
        console.log(data);
        this.setState({
          iCC: "",
          iCCKey: "",
          iHeight: "",
          iHy: "",
          iHz: "",
          iFx: "",
          formSubmitted: true,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  render() {
    return (
      <>
        <DemoNavbar />
        <main className="profile-page" ref="main">
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="fill-white"
                  points="2560 0 2560 100 0 100"
                />
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
                          <img
                            alt="..."
                            className="rounded-circle"
                            src={require("assets/img/theme/b5-800x800.jpg")}
                          />
                        </a>
                      </div>
                    </Col>
                    <Col
                      className="order-lg-3 text-lg-right align-self-lg-center"
                      lg="4"
                    ></Col>
                    <Col className="order-lg-1" lg="4">
                      <div className="card-profile-stats d-flex justify-content-center"></div>
                    </Col>
                  </Row>
                  <div className="text-center mt-7">
                    <h3>Calculate Your Structural Column </h3>

                    <div>
                      <i className="ni education_hat mr-2" />
                      We use most sofisticated technology to design your
                      structural elemet.
                      <div>
                        <i className="ni education_hat mr-2" />
                        Please enter the necessary information in the below
                        fields to design your element
                      </div>
                    </div>
                  </div>
                  <Container className="mb-5">
                    <h3 className="h4 text-success font-weight-bold mb-4"></h3>
                    <div className="mb-3">
                      <small className="text-muted mb-0">
                        Fields with * are required
                      </small>
                    </div>
                    <Form onSubmit={this.handleSubmit}>
                      <Row>
                        <Col lg="5" sm="5">
                          <FormGroup>
                            <UncontrolledDropdown group>
                              <DropdownToggle caret color="secondary">
                                {this.state.iCCKey || "Select Concrete Class*"}
                              </DropdownToggle>
                              <DropdownMenu
                                style={{
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                }}
                              >
                                {Object.keys(this.ConcreteClassForStutzen).map(
                                  (key) => (
                                    <DropdownItem
                                      href="#pablo"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        this.setState({
                                          iCC: this.ConcreteClassForStutzen[
                                            key
                                          ],
                                          iCCKey: key,
                                          dropdownError: false,
                                        });
                                      }}
                                    >
                                      {key}
                                    </DropdownItem>
                                  )
                                )}
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg="5" sm="5">
                          <FormGroup>
                            <Input
                              className="form-control-alternative"
                              placeholder="Height*"
                              type="text"
                              name="iHeight"
                              value={this.state.iHeight}
                              onChange={(e) =>
                                this.setState({ iHeight: e.target.value })
                              }
                              required
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg="5" sm="5">
                          <FormGroup>
                            <Input
                              className="form-control-alternative"
                              placeholder="Bredth*"
                              type="text"
                              name="iHy"
                              value={this.state.iHy}
                              onChange={(e) =>
                                this.setState({ iHy: e.target.value })
                              }
                              required
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg="5" sm="5">
                          <FormGroup>
                            <Input
                              className="form-control-alternative"
                              placeholder="Depth*"
                              type="text"
                              name="iHz"
                              value={this.state.iHz}
                              onChange={(e) =>
                                this.setState({ iHz: e.target.value })
                              }
                              required
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg="5" sm="5">
                          <FormGroup>
                            <Input
                              className="form-control-alternative"
                              placeholder="Load factor*"
                              type="text"
                              name="iFx"
                              value={this.state.iFx}
                              onChange={(e) =>
                                this.setState({ iFx: e.target.value })
                              }
                              required
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg="5" sm="5">
                          <Button color="primary">Submit</Button>
                        </Col>
                      </Row>
                    </Form>
                    {this.state.formSubmitted && (
                      <UncontrolledAlert color="success" fade={true}>
                        <span className="alert-inner--icon">
                          <i className="ni ni-like-2" />
                        </span>{" "}
                        <span className="alert-inner--text">
                          <strong>Success!</strong> Your details have been
                          submitted.
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
  }
}

export default b5SingleLoad;
