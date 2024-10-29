import { Card, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breakpoints } from "./Breakpoints";
import ButtonCustom from "./ButtonCustom";
import Error from "./Error";
import ForgotPasswordText from "./ForgotPasswordText";
import Input from "./Input";
import { Signin } from "../Functions/Registration";
import { SignUpContext } from "../Context/SignupContext";
import { GlobalContext } from "../Context/GlobalContext";
import Label from "./Label";

export default function Login({
  view,
  setView,
  Email,
  setEmail,
  password,
  setpassword,
}) {
  const [checked, setchecked] = useState(false);

  const [Err, setErr] = useState("");
  const { SigninData, setSigninData, setSignUpData, SignUpData } =
    useContext(SignUpContext);
  const { setSpin, SETSUCCESS, SETERROR } = useContext(GlobalContext);
  const navigate = useNavigate();

  return (
    <Card
      variant="none"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: Breakpoints("100%", 370, 370, 370, 370, 370),
        borderRadius: 3,
      }}
    >
      <p>Please login to your account</p>
      {/* <form>
                      <p>Please login to your account</p>

                      <div data-mdb-input-init class="form-outline mb-4">
                        <input
                          type="email"
                          id="form2Example11"
                          class="form-control"
                          placeholder="Phone number or email address"
                        />
                        <label class="form-label" for="form2Example11">
                          Username
                        </label>
                      </div>

                      <div data-mdb-input-init class="form-outline mb-4">
                        <input
                          type="password"
                          id="form2Example22"
                          class="form-control"
                        />
                        <label class="form-label" for="form2Example22">
                          Password
                        </label>
                      </div>

                      <div class="text-center pt-1 mb-5 pb-1">
                        <button
                          data-mdb-button-init
                          data-mdb-ripple-init
                          class="btn btn-primary btn-block fa-lg gradient-custom-2 mb-3"
                          type="button"
                        >
                          Log in
                        </button>
                        <a class="text-muted" href="#!">
                          Forgot password?
                        </a>
                      </div>

                      <div class="d-flex align-items-center justify-content-center pb-4">
                        <p class="mb-0 me-2">Don't have an account?</p>
                        <button
                          type="button"
                          data-mdb-button-init
                          data-mdb-ripple-init
                          class="btn btn-outline-danger"
                        >
                          Create new
                        </button>
                      </div>
                    </form> */}
      {/* <Label text={"Sign in / Sign up"} ></Label> */}
      <Typography sx={{ mt: 0 }} fontFamily={"sans-serif"}>
        Email address
      </Typography>
      <Input
        placeholder={"Email"}
        mt={0.1}
        BorderColor={"black"}
        type="text"
        mx={0}
        state={Email}
        setstate={setEmail}
      ></Input>
      <Error msg={Err} mb={1} mx={0}></Error>
      {/* <CheckBoxCustom
        checked={checked}
        text={"Signin with otp"}
        onChangeChecked={() => ToggleTrueFalse(checked, setchecked)}
      >
      </CheckBoxCustom> */}
      <Typography>Password</Typography>
      <Input
        placeholder={"Password"}
        BorderColor={"black"}
        mt={0.1}
        type="password"
        mx={0}
        disabled={checked}
        state={password}
        setstate={setpassword}
      ></Input>
      {/* <Error msg={true?"Coundn't Find the Careersstudio account associated with this email":""} mb={1} mx={2}></Error> */}

      <ButtonCustom
        text={"Login"}
        borderRadius={1}
        mx={0}
        my={2}
        mt={2}
        Click={() =>
          Signin(
            Email,
            password,
            checked,
            setErr,
            navigate,
            SigninData,
            setSigninData,
            setSignUpData,
            SignUpData,
            setSpin,
            SETERROR,
            SETSUCCESS,
            view,
            setView,
            
          )
        }
      ></ButtonCustom>

      <ForgotPasswordText mx={0} view={view} setview={setView}>
        {" "}
      </ForgotPasswordText>
      <div class="d-flex align-items-center justify-content-center pb-4">
        <p class="mb-0 me-2">Don't have an account?</p>
        <button
          type="button"
          data-mdb-button-init
          data-mdb-ripple-init
          class="btn btn-outline-danger"
          onClick={() => setView("Signup")}
        >
          Create new
        </button>
      </div>
      {/* <Typography sx={{ fontWeight: "bold", color: "blue", textAlign: "center", }}>New to Careersstudio? <Link style={{ textDecoration: "none" }} to="/sign-up">Join now</Link></Typography> */}
    </Card>
  );
}
